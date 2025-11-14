import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StatusSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const incoming = req.headers['x-status-secret'];
    const expected = this.config.get<string>('GATEWAY_STATUS_SECRET') || '';

    if (!expected) {
      throw new UnauthorizedException('Gateway status secret not configured');
    }
    if (incoming !== expected) {
      throw new UnauthorizedException('Invalid status secret');
    }
    return true;
  }
}
