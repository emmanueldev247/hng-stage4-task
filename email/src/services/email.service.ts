// src/services/email.service.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendGridService } from './sendgrid.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { RedisService } from './redis.service';
import { NotificationRequestDto } from '../dtos/notification.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(
    private configService: ConfigService,
    private sendGridService: SendGridService,
    private circuitBreaker: CircuitBreakerService,
    private redisService: RedisService,
  ) {}

  async processEmailNotification(data: NotificationRequestDto): Promise<void> {
    const { request_id, user_id, template_code, variables } = data;

    try {
      // Check circuit breaker
      if (!this.circuitBreaker.canExecute('sendgrid')) {
        this.logger.warn(`Circuit breaker is open for SendGrid, requeuing message: ${request_id}`);
        throw new Error('Service temporarily unavailable');
      }

      // Check if this request was already processed (idempotency)
      const processed = await this.redisService.get(`processed:${request_id}`);
      if (processed) {
        this.logger.log(`Request ${request_id} already processed, skipping`);
        return;
      }

      // Get user email from User Service (mock for now - will be replaced with actual service call)
      const userEmail = await this.getUserEmail(user_id);
      
      // Get template from Template Service (mock for now)
      const template = await this.getTemplate(template_code);
      
      // Replace template variables
      const emailContent = this.replaceTemplateVariables(template, variables);
      const emailSubject = this.extractSubject(template);

      // Send email with retry logic
      await this.sendWithRetry(userEmail, emailSubject, emailContent, request_id);

      // Mark as processed
      await this.redisService.set(`processed:${request_id}`, { status: 'delivered' }, 86400); // 24 hours
      
      // Update circuit breaker
      this.circuitBreaker.onSuccess('sendgrid');

      this.logger.log(`Email notification processed successfully: ${request_id}`);

    } catch (error) {
      this.circuitBreaker.onFailure('sendgrid');
      this.logger.error(`Failed to process email notification ${request_id}:`, error);
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
    } catch (error) {
      if (retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        this.logger.warn(`Retry ${retryCount + 1} for ${requestId} after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(to, subject, html, requestId, retryCount + 1);
      }
      throw error;
    }
  }

  private async getUserEmail(userId: string): Promise<string> {
    // TODO: Replace with actual User Service call
    // For now, return a mock email
    return `user-${userId}@example.com`;
  }

  private async getTemplate(templateCode: string): Promise<string> {
    // TODO: Replace with actual Template Service call
    // For now, return a mock template
    const templates: Record<string, string> = {
      welcome: `
        <html>
          <body>
            <h1>Welcome {{name}}!</h1>
            <p>Thank you for joining us.</p>
            <a href="{{link}}">Get started</a>
          </body>
        </html>
      `,
      reset_password: `
        <html>
          <body>
            <h1>Password Reset</h1>
            <p>Hello {{name}}, click the link to reset your password:</p>
            <a href="{{link}}">Reset Password</a>
          </body>
        </html>
      `,
    };

    return templates[templateCode] || templates.welcome;
  }

  private replaceTemplateVariables(template: string, variables: any): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }

  private extractSubject(template: string): string {
    // Extract subject from template or use default
    const match = template.match(/<title>(.*?)<\/title>/);
    return match ? match[1] : 'Notification';
  }
}