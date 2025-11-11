// src/controllers/email.controller.ts
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { EmailService } from '../services/email.service';
import { NotificationRequestDto } from '../dtos/notification.dto';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  async onApplicationBootstrap() {
    this.logger.log('Email Controller started and listening for messages');
  }

  // Use a pattern that matches what NestJS expects
  @MessagePattern({ cmd: 'email_notification' })
  async handleEmailNotification(
    @Payload() data: NotificationRequestDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(`Received email notification: ${data.request_id}`);
      
      // Validate the data structure
      if (!data.request_id || !data.notification_type) {
        throw new Error('Invalid message format: missing required fields');
      }

      // Process the notification
      await this.emailService.processEmailNotification(data);

      // Acknowledge the message
      channel.ack(originalMsg);
      this.logger.log(`Email notification processed successfully: ${data.request_id}`);
    } catch (error) {
      this.logger.error(`Failed to process email notification ${data.request_id}:`, error);

      // Reject the message and don't requeue (will go to DLQ)
      channel.nack(originalMsg, false, false);
    }
  }
}