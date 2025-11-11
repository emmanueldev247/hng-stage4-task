// src/controllers/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../services/redis.service';
import { ResponseDto } from '../dtos/response.dto';

@Controller('health')
export class HealthController {
  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  @Get()
  async checkHealth() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'email-service',
      version: '1.0.0',
    };

    return ResponseDto.success(health, 'Service is healthy');
  }

  @Get('detailed')
  async detailedHealth() {
    const checks = {
      redis: await this.checkRedis(),
      sendgrid: this.configService.get('SENDGRID_API_KEY') ? 'configured' : 'not_configured',
    };

    const allHealthy = Object.values(checks).every(status => status === 'healthy' || status === 'configured');

    const health = {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };

    return ResponseDto.success(health, allHealthy ? 'All systems operational' : 'Some systems are degraded');
  }

  private async checkRedis(): Promise<'healthy' | 'unhealthy'> {
    try {
      await this.redisService.set('health-check', 'ok', 10);
      const value = await this.redisService.get('health-check');
      return value === 'ok' ? 'healthy' : 'unhealthy';
    } catch {
      return 'unhealthy';
    }
  }
}