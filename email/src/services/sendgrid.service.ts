import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const SendGrid = require('@sendgrid/mail');

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      SendGrid.setApiKey(apiKey);
      this.isInitialized = true;
      this.logger.log('SendGrid service initialized');
    } else {
      this.logger.warn(
        'SENDGRID_API_KEY not found - running in development mode',
      );
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    from?: string,
  ): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.warn('SendGrid not initialized - simulating email send');
      this.logger.log(`Would send email to: ${to}, subject: ${subject}`);
      return true;
    }

    try {
      const fromEmail =
        from ||
        this.configService.get<string>('SENDGRID_FROM_EMAIL') ||
        'noreply@example.com';

      const msg = {
        to,
        from: fromEmail,
        subject,
        html,
      };

      await SendGrid.send(msg);
      this.logger.log(`Email sent successfully to: ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}
