import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import axiosRetry from 'axios-retry';
import * as CircuitBreaker from 'opossum';
import { HttpException } from '@nestjs/common';

@Injectable()
export abstract class BaseHttpClient {
  protected axiosClient: AxiosInstance;
  protected readonly logger: Logger;
  private breaker: CircuitBreaker<[AxiosRequestConfig], AxiosResponse<any>>;

  constructor(
    protected readonly config: ConfigService,
    protected readonly serviceName: string,
    protected readonly baseUrlKey: string,
  ) {
    this.logger = new Logger(`${serviceName}Client`);

    const baseURL = this.config.get<string>(this.baseUrlKey);
    if (!baseURL) {
      this.logger.warn(
        `[${this.serviceName}] Base URL key "${this.baseUrlKey}" is not defined. Requests may fail.`,
      );
    }
    this.axiosClient = axios.create({ baseURL: baseURL ?? '', timeout: 5000 });

    // Retry policy
    axiosRetry(this.axiosClient, {
      retries: 3,
      retryDelay: (count) => count * 1000,
      retryCondition: (error) => {
        const status = error.response?.status;
        return !status || (status >= 500 && status < 600);
      },
    });

    // Global interceptor for mapping errors
    this.axiosClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.mapAxiosError(error),
    );

    // Circuit breaker
    this.breaker = new CircuitBreaker(
      (config: AxiosRequestConfig) => this.axiosClient.request(config),
      {
        timeout: 7000,
        errorThresholdPercentage: 50,
        resetTimeout: 15000,
        volumeThreshold: 5,
      },
    );

    this.breaker.on('open', () =>
      this.logger.warn(`Circuit breaker OPEN - ${serviceName} unavailable`),
    );
    this.breaker.on('halfOpen', () =>
      this.logger.log(`Circuit breaker HALF-OPEN - testing ${serviceName}`),
    );
    this.breaker.on('close', () =>
      this.logger.log(`Circuit breaker CLOSED - ${serviceName} restored`),
    );
  }

  protected async request<T>(config: AxiosRequestConfig): Promise<T> {
    if (!this.axiosClient.defaults.baseURL) {
      throw new ServiceUnavailableException(
        `${this.serviceName} service not configured`,
      );
    }
    const response = (await this.breaker.fire(config)) as AxiosResponse<T>;
    return response.data;
  }

  private mapAxiosError(error: AxiosError): never {
    const status = error.response?.status ?? 503;

    const upstream = error.response?.data;

    const payload =
      upstream && typeof upstream === 'object'
        ? upstream
        : { message: String(upstream ?? error.message) };
    this.logger.error(
      `[${this.serviceName}] upstream ${status}: ${JSON.stringify(payload)}`,
    );
    throw new HttpException(payload, status);
  }
}
