import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OptionalRestAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;

    if (!auth || !auth.startsWith('Bearer ')) {
      req.user = undefined;
      return true;
    }

    const token = auth.slice('Bearer '.length).trim();
    try {
      const payload = this.jwt.verify(token);
      req.user = { id: payload.sub, ...payload };
      return true;
    } catch {
      req.user = undefined;
      return true;
    }
  }
}
