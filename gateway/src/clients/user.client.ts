import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheKeys } from 'src/cache/cache-keys';
import { Cached } from 'src/cache/cache.decorator';
import {
  CreateUserDto,
  UserContactResponseDto,
  UserResponseDto,
} from 'src/modules/user/dto';
import { PatchUserDto } from 'src/modules/user/dto/patch-user.dto';
import { BaseHttpClient } from './base-http.client';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class UserClient extends BaseHttpClient {
  constructor(
    config: ConfigService,
    private readonly cache: CacheService,
  ) {
    super(config, 'User', 'USER_SERVICE_URL');
  }

  async createUser(userData: CreateUserDto): Promise<UserResponseDto> {
    return this.request<UserResponseDto>({
      method: 'POST',
      url: '/users',
      data: userData,
    });
  }

  async validateUserPassword(
    email: string,
    password: string,
  ): Promise<UserResponseDto> {
    return this.request<UserResponseDto>({
      method: 'POST',
      url: '/users/validate-password',
      data: { email, password },
    });
  }

  @Cached('15m', (userId: string) => CacheKeys.userContact(userId))
  async getContactInfo(userId: string): Promise<UserContactResponseDto> {
    return this.request<UserContactResponseDto>({
      method: 'GET',
      url: `/users/${userId}/contact`,
    });
  }

  async updateUser(
    userId: string,
    data: PatchUserDto,
  ): Promise<UserResponseDto> {
    return this.request<UserResponseDto>({
      method: 'PATCH',
      url: `/users/${userId}`,
      data,
    });
  }

  async addToken(userId: string, device_token: string) {
    await this.request({
      method: 'PUT',
      url: `/users/${userId}/devices`,
      data: { device_token },
    });
    return { success: true, message: 'Device token added successfully' };
  }

  async removeToken(userId: string, token: string) {
    await this.request({
      method: 'DELETE',
      url: '/devices',
      data: { device_token: token },
    });
    return { success: true, message: 'Device token removed successfully' };
  }
}
