import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './services';
import { LoginDto, RegisterDto } from './dto';

@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.signup(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
