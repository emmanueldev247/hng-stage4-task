import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { Channel, Message } from 'amqplib';
import { NotificationPayloadDto } from './dto/notification-payload.dto';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationHandler {
  constructor(private readonly notification: NotificationService) {}
  private readonly logger = new Logger(NotificationHandler.name);

  @EventPattern('notifications.push')
  async handlePushNotification(
    @Payload() data: NotificationPayloadDto,
    @Ctx() context: RmqContext,
  ) {
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as Message;

    try {
      this.logger.log(`Received push notification: ${JSON.stringify(data)}`);
      await this.notification.handlePushNotification(data);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);

      const failedPayload = {
        ...data,
        error: msg,
        failed_at: new Date().toISOString(),
      };
      channel.sendToQueue(
        'failed.queue',
        Buffer.from(JSON.stringify(failedPayload)),
        { persistent: true },
      );
      this.logger.error(`Push processing failed: ${err}`);
    }
    channel.ack(originalMsg);
  }
}
