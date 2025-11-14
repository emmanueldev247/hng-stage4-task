import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface StatusPayload {
  notification_id: string;
  status: 'delivered' | 'pending' | 'failed';
  timestamp?: string;
  error?: string | null;
}

@Injectable()
export class StatusReporterService {
  private readonly logger = new Logger(StatusReporterService.name);
  private readonly url: string;
  private readonly secret?: string;

  constructor(config: ConfigService) {
    this.url = config.get<string>('GATEWAY_STATUS_URL')!;
    this.secret = config.get<string>('GATEWAY_STATUS_SECRET');
  }

  async report(payload: StatusPayload) {
    if (!this.url) {
      this.logger.warn('GATEWAY_STATUS_URL not set; skipping status callback');
      return;
    }
    try {
      await axios.post(this.url, payload, {
        headers: this.secret ? { 'X-Status-Secret': this.secret } : undefined,
        timeout: 4000,
      });
      this.logger.log(
        `Status reported to gateway: ${payload.notification_id}=${payload.status}`,
      );
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      this.logger.warn(`Failed to report status to gateway: ${msg}`);
    }
  }
}
