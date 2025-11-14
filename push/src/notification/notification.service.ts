import { Injectable, Logger } from '@nestjs/common';
import { NotificationPayloadDto } from './dto/notification-payload.dto';
import { FirebaseService } from 'src/firebase/firebase.provider';
import { CacheService } from 'src/cache/cache.service';
import { ProcessedRequestDto } from './dto/processed-request.dto';
import * as CircuitBreaker from 'opossum';
import { StatusReporterService } from './status-reporter.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly breaker: CircuitBreaker;
  constructor(
    private readonly firebase: FirebaseService,
    private readonly cache: CacheService,
    private readonly statusReporter: StatusReporterService,
  ) {
    this.breaker = new CircuitBreaker(
      async (data: NotificationPayloadDto) => {
        const maxRetries = 3;
        let attempt = 0;
        while (attempt < maxRetries) {
          try {
            await this.firebase.sendPushNotification(
              data.to,
              data.title,
              data.body,
              { request_id: data.request_id },
            );
            return;
          } catch (err) {
            attempt++;
            if (attempt >= maxRetries) throw err;
            const delay = 1000 * 2 ** attempt;
            this.logger.warn(
              `Retry ${attempt} for request_id=${data.request_id} in ${delay}ms`,
            );
            await new Promise((res) => setTimeout(res, delay));
          }
        }
      },
      {
        timeout: 7000,
        errorThresholdPercentage: 50,
        resetTimeout: 15000,
      },
    );
    this.breaker.on('open', () =>
      this.logger.warn('Circuit breaker OPEN - Firebase down'),
    );
    this.breaker.on('halfOpen', () =>
      this.logger.log('Circuit breaker HALF-OPEN'),
    );
    this.breaker.on('close', () =>
      this.logger.log('Circuit breaker CLOSED - Firebase restored'),
    );
  }

  async handlePushNotification(data: NotificationPayloadDto) {
    const { request_id } = data;

    const cached = await this.cache.get<ProcessedRequestDto>(
      `processed:${request_id}`,
    );
    if (cached) {
      this.logger.log(`Request ${data.request_id} already processed, skipping`);
      return;
    }
    try {
      const resp: any = await this.breaker.fire(data);

      await this.cache.set(
        `processed:${request_id}`,
        {
          status: 'delivered',
        },
        86400,
      );

      this.logger.log(
        `Push sent successfully for request_id=${data.request_id}`,
      );
      const invalidTokens = Array.isArray((resp as any)?.invalidTokens)
        ? (resp as any).invalidTokens
        : undefined;

      await this.statusReporter.report({
        notification_id: request_id,
        status: 'delivered',
        timestamp: new Date().toISOString(),
        invalid_tokens: invalidTokens,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Push failed for request_id=${data.request_id}: ${msg}`,
      );

      await this.statusReporter.report({
        notification_id: request_id,
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: msg,
      });
      throw err;
    }
  }
}
