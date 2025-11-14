import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendGridService } from './sendgrid.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { RedisService } from './redis.service';
import { SimplifiedNotificationDto } from '../dtos/notification.dto';
import { StatusReporterService } from './status-reporter.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor(
    private configService: ConfigService,
    private sendGridService: SendGridService,
    private circuitBreaker: CircuitBreakerService,
    private redisService: RedisService,
    private statusReporter: StatusReporterService,
  ) {}

  async processEmailNotification(
    data: SimplifiedNotificationDto,
  ): Promise<void> {
    const { request_id, to, subject, body } = data;

    try {
      // Check idempotency
      const processed = await this.redisService.get(`processed:${request_id}`);
      if (processed) {
        this.logger.log(`🔄 Request ${request_id} already processed, skipping`);
        return;
      }

      // Check circuit breaker
      if (!this.circuitBreaker.canExecute('sendgrid')) {
        throw new Error('SendGrid service temporarily unavailable');
      }

      // Send email with retry logic
      await this.sendWithRetry(to, subject, body, request_id);

      // Mark as processed
      await this.redisService.set(
        `processed:${request_id}`,
        {
          status: 'delivered',
          to,
          subject,
          timestamp: new Date().toISOString(),
        },
        86400,
      );

      // Update circuit breaker
      this.circuitBreaker.onSuccess('sendgrid');

      this.logger.log(`📨 Email delivered: ${request_id} to ${to}`);

      // Report status
      await this.statusReporter.report({
        notification_id: request_id,
        status: 'delivered',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.circuitBreaker.onFailure('sendgrid');
      this.logger.error(`💥 Failed to process email ${request_id}:`, error);

      try {
        await this.statusReporter.report({
          notification_id: request_id,
          status: 'failed',
          timestamp: new Date().toISOString(),
          error: error?.message ?? String(error),
        });
      } catch {}
      throw error;
    }
  }

  private async sendWithRetry(
    to: string,
    subject: string,
    html: string,
    requestId: string,
    retryCount = 0,
  ): Promise<void> {
    try {
      await this.sendGridService.sendEmail(to, subject, html);
      this.logger.log(
        `✅ Email sent to ${to} on attempt ${retryCount + 1} (req=${requestId})`,
      );
    } catch (error) {
      if (retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        this.logger.warn(
          `🔄 Retry ${retryCount + 1} for ${requestId} after ${delay}ms`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.sendWithRetry(to, subject, html, requestId, retryCount + 1);
      }
      this.logger.error(`💥 All retries failed for ${requestId}`);
      throw error;
    }
  }
}
