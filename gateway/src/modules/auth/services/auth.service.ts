import { BadRequestException, Injectable } from '@nestjs/common';
import { TokenService } from './token.service';
import { AuthResponseDto, LoginDto, RegisterDto } from '../dto';
import { UserClient } from 'src/clients';
import { UserDto } from 'src/modules/user/dto';

@Injectable()
export class AuthService {
  constructor(
    private token: TokenService,
    private userClient: UserClient,
  ) {}

  private async issueTokens(user: UserDto): Promise<AuthResponseDto> {
    const access = await this.token.access(user.id);
    return {
      access,
      user,
    };
  }

  async signup(data: RegisterDto): Promise<AuthResponseDto> {
    if (!data) throw new BadRequestException('Invalid credentials');
    const user = await this.userClient.createUser(data);
    return this.issueTokens(user);
  }

  async login(data: LoginDto): Promise<AuthResponseDto> {
    if (!data) throw new BadRequestException('Invalid credentials');
    const user = await this.userClient.validateUserPassword(
      data.email,
      data.password,
    );
    return this.issueTokens(user);
  }
}
