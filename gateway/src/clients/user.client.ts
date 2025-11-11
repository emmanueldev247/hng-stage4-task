import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { UserDto } from 'src/common/dto';

@Injectable()
export class UserClient {
  private axiosClient: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('USER_SERVICE_URL');
    if (!url) {
      throw new InternalServerErrorException('USER_SERVICE_URL is not defined');
    }
    this.axiosClient = axios.create({
      url,
      timeout: 5000,
    });
  }

  async validateUserPassword(
    email: string,
    password: string,
  ): Promise<UserDto> {
    const user = await this.axiosClient.post<UserDto>('/validate', {
      email,
      password,
    });
    return user.data;
  }

  async getUserInfo(userId: string): Promise<UserDto> {
    const user = await this.axiosClient.get<UserDto>(`/users/${userId}`);
    return user.data;
  }

  async createUser(userData: any): Promise<UserDto> {
    const newUser = await this.axiosClient.post<UserDto>('/users', userData);
    return newUser.data;
  }
}
