import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './services';
import { AuthResponseDto, LoginDto } from './dto';
import { CreateUserDto } from 'src/modules/user/dto';

@ApiTags('Authentication')
@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @HttpCode(201)
  async register(@Body() body: CreateUserDto) {
    return this.authService.signup(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'User logged in successfully',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
