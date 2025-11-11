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
import { UserDto } from 'src/common/dto';
import { PatchUserDto } from 'src/modules/user/dto/patch-user.dto';
import * as CircuitBreaker from 'opossum';
import axiosRetry from 'axios-retry';
import { RegisterDto } from 'src/modules/auth/dto';

@Injectable()
export class UserClient {
  private axiosClient: AxiosInstance;
  private readonly logger = new Logger(UserClient.name);
  private breaker: CircuitBreaker;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.get<string>('USER_SERVICE_URL');
    if (!baseURL) {
      throw new InternalServerErrorException('USER_SERVICE_URL is not defined');
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
        'User service currently unavailable',
      );
    }
  }

  async validateUserPassword(
    email: string,
    password: string,
  ): Promise<UserDto> {
    return this.request<UserDto>({
      method: 'POST',
      url: '/validate',
      data: { email, password },
    });
  }

  @Cached('15m', (userId: string) => CacheKeys.user(userId))
  async getUserInfo(userId: string): Promise<UserDto> {
    return this.request<UserDto>({
      method: 'GET',
      url: `/users/${userId}`,
    });
  }

  async createUser(userData: RegisterDto): Promise<UserDto> {
    return this.request<UserDto>({
      method: 'PUT',
      url: '/users',
      data: userData,
    });
  }

  async updateUser(userId: string, data: PatchUserDto): Promise<UserDto> {
    return this.request<UserDto>({
      method: 'PATCH',
      url: `/users/${userId}`,
      data,
    });
  }

  async addToken(userId: string, token: string) {
    await this.request({
      method: 'PUT',
      url: `/users/${userId}/device_tokens`,
      data: { token },
    });
    return { success: true };
  }

  async removeToken(userId: string, token: string) {
    await this.request({
      method: 'DELETE',
      url: `/users/${userId}/device_tokens/${token}`,
    });
    return { success: true };
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
        this.logger.error(`User Service error: ${message}`);
        throw new ServiceUnavailableException(`User Service: ${message}`);
    }
  }
}
