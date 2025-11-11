import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './services';
import { UserClient } from 'src/clients';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'dev-secret',
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, TokenService, UserClient],
  controllers: [AuthController],
})
export class AuthModule {}
