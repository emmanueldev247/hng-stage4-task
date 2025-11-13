import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { EmailService } from '../services/email.service';
import { SimplifiedNotificationDto } from '../dtos/notification.dto';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  async onModuleInit() {
    this.logger.log(
      '✅ Email Controller initialized - waiting for messages...',
    );
  }

  async onApplicationBootstrap() {
    this.logger.log('🚀 Email microservice ready - listening on email.queue');
  }

  @EventPattern('email.notification')
  async handleEmailNotification(
    @Payload() raw: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const rk = originalMsg?.fields?.routingKey;
    const corr = originalMsg?.properties?.correlationId ?? '-';
    this.logger.log(`📨 Received message rk=${rk} corr=${corr}`);

    const data: any =
      raw && typeof raw === 'object'
        ? 'data' in raw && raw.pattern
          ? raw.data
          : raw
        : raw;

    try {
      if (!data?.request_id) throw new Error('Missing request_id');
      if (!data?.to || !String(data.to).includes('@'))
        throw new Error('Invalid email address');
      if (!data?.subject || !String(data.subject).trim())
        throw new Error('Empty subject');

      this.logger.log(
        `📧 Processing email request_id=${data.request_id} to=${data.to}`,
      );
      await this.emailService.processEmailNotification(
        data as SimplifiedNotificationDto,
      );

      channel.ack(originalMsg);
      this.logger.log(`✅ Acked request_id=${data.request_id}`);
    } catch (err: any) {
      this.logger.error(
        `❌ Error request_id=${data?.request_id ?? '-'}: ${err?.message ?? err}`,
      );
      channel.nack(originalMsg, false, false);
    }
  }
}
