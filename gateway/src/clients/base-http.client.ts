import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
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
    const baseURL = this.config.get<string>(this.baseUrlKey);
    if (!baseURL) {
      throw new InternalServerErrorException(
        `${this.baseUrlKey} is not defined`,
      );
    }

    this.logger = new Logger(`${serviceName}Client`);
    this.axiosClient = axios.create({ baseURL, timeout: 5000 });

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
    try {
      const response = (await this.breaker.fire(config)) as AxiosResponse<T>;
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `[${this.serviceName}] Request to ${config.url} failed: ${error}`,
      );
      throw new ServiceUnavailableException(
        `${this.serviceName} service currently unavailable`,
      );
    }
  }

  private mapAxiosError(error: AxiosError): never {
    const status = error.response?.status;
    const message = error.message;

    switch (status) {
      case 400:
        throw new BadRequestException(message);
      case 401:
        throw new UnauthorizedException(message);
      case 404:
        throw new NotFoundException(message);
      case 409:
        throw new ConflictException(message);
      case 500:
      default:
        this.logger.error(`[${this.serviceName}] Internal error: ${message}`);
        throw new ServiceUnavailableException(
          `${this.serviceName} service error: ${message}`,
        );
    }
  }
}
