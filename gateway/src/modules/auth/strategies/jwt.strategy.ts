// jwt.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserClient } from 'src/clients';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private user: UserClient,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'defaultSecret',
    });
  }

  async validate({ sub: id }: { sub: string }) {
    if (!id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.user.getUserInfo(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      user,
    };
  }
}
