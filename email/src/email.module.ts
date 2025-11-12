import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './services/email.service';
import { EmailController } from './controllers/email.controller';
import { SendGridService } from './services/sendgrid.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { RedisService } from './services/redis.service';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [EmailController, HealthController],
  providers: [EmailService, SendGridService, CircuitBreakerService, RedisService],
})
export class EmailModule {}