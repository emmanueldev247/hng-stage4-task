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
import { CacheKeys } from 'src/cache/cache-keys';
import { Cached } from 'src/cache/cache.decorator';
import { TemplateDto, TemplateResponseDto } from 'src/common/dto';
import * as CircuitBreaker from 'opossum';
import axiosRetry from 'axios-retry';

@Injectable()
export class TemplateClient {
  private axiosClient: AxiosInstance;
  private readonly logger = new Logger(TemplateClient.name);
  private breaker: CircuitBreaker;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.get<string>('TEMPLATE_SERVICE_URL');
    if (!baseURL) {
      throw new InternalServerErrorException(
        'TEMPLATE_SERVICE_URL is not defined',
      );
    }
    this.axiosClient = axios.create({
      baseURL,
      timeout: 5000,
    });
    axiosRetry(this.axiosClient, {
      retries: 3,
      retryDelay: (count) => count * 1000, // 1s, 2s, 3s
      retryCondition: (error) => {
        const status = error.response?.status;
        return !status || (status >= 500 && status < 600); // Retry on 5xx
      },
    });
    this.axiosClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.mapAxiosError(error),
    );
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
      this.logger.warn('Circuit breaker OPEN - user service unavailable'),
    );
    this.breaker.on('halfOpen', () =>
      this.logger.log('Circuit breaker HALF-OPEN - testing connection'),
    );
    this.breaker.on('close', () =>
      this.logger.log('Circuit breaker CLOSED - user service restored'),
    );
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = (await this.breaker.fire(config)) as AxiosResponse<T>;
      return response.data;
    } catch (error: any) {
      this.logger.error(`Request to ${config.url} failed: ${error}`);
      throw new InternalServerErrorException(
        'Template service currently unavailable',
      );
    }
  }

  @Cached('15m', (code: string) => CacheKeys.template(code))
  async getTemplate(code: string): Promise<TemplateDto> {
    const response = await this.request<TemplateResponseDto>({
      method: 'GET',
      url: `/templates?template_code=${code}`,
    });
    return response.data;
  }

  private mapAxiosError(error: AxiosError) {
    const status = error.response?.status;
    const message: string = error.message;
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
        this.logger.error(`Template Service error: ${message}`);
        throw new ServiceUnavailableException(`Template Service: ${message}`);
    }
  }
}
