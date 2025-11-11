import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const provided = (req.headers['x-api-key'] as string | undefined)?.trim();
    const expected = process.env.TEMPLATE_ADMIN_API_KEY?.trim();

    if (!expected) {
      throw new ForbiddenException('admin auth not configured');
    }
    if (!provided || provided !== expected) {
      throw new ForbiddenException('invalid or missing x-api-key');
    }
    return true;
  }
}
