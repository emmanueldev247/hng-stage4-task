import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { EmailService } from '../services/email.service';
import { SimplifiedNotificationDto } from '../dtos/notification.dto';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  async onModuleInit() {
    this.logger.log('✅ Email Controller initialized - waiting for messages...');
  }

  async onApplicationBootstrap() {
    this.logger.log('🚀 Email microservice ready - listening on email.queue');
  }

  @EventPattern('email.notification')
  async handleEmailNotification(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    
    this.logger.log('📨 Received RabbitMQ message');

    try {
      // Extract data 
      const notificationData = data.pattern && data.data ? data.data : data;

      // MINIMAL VALIDATION - Critical fields only
      if (!notificationData?.request_id) {
        throw new Error('Missing request_id - cannot ensure idempotency');
      }

      if (!notificationData?.to || !notificationData.to.includes('@')) {
        throw new Error('Invalid email address format');
      }

      if (!notificationData?.subject?.trim()) {
        throw new Error('Empty email subject');
      }

      this.logger.log(`📧 Processing email: ${notificationData.request_id}`);
      
      // Process the email
      await this.emailService.processEmailNotification(notificationData as SimplifiedNotificationDto);

      channel.ack(originalMsg);
      this.logger.log(`✅ Email sent successfully: ${notificationData.request_id}`);
      
    } catch (error) {
      this.logger.error(`❌ Failed to process: ${error.message}`);
      // Send to DLQ for investigation
      channel.nack(originalMsg, false, false);
    }
  }
}