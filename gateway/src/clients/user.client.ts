import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheKeys } from 'src/cache/cache-keys';
import { Cached } from 'src/cache/cache.decorator';
import { UserDto } from 'src/modules/user/dto';
import { PatchUserDto } from 'src/modules/user/dto/patch-user.dto';
import { RegisterDto } from 'src/modules/auth/dto';
import { BaseHttpClient } from './base-http.client';

@Injectable()
export class UserClient extends BaseHttpClient {
  constructor(config: ConfigService) {
    super(config, 'User', 'USER_SERVICE_URL');
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
    return { success: true, message: 'Device token added successfully' };
  }

  async removeToken(userId: string, token: string) {
    await this.request({
      method: 'DELETE',
      url: `/users/${userId}/device_tokens/${token}`,
    });
    return { success: true, message: 'Device token removed successfully' };
  }
}
