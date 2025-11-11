import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { randomUUID } from 'node:crypto';
import { NotificationDto } from './dto/notification.dto';
import { UserClient } from 'src/clients';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('NOTIFICATION_SERVICE') private client: ClientProxy,
    private userClient: UserClient,
  ) {}

  async sendNotification(user_id: string, data: NotificationDto) {
    const { template_id, variables } = data;
    const request_id = randomUUID();
    const user = await this.userClient.getUserInfo(user_id);
    const { name, email, preferences, device_tokens } = user;
    if (preferences.email_notifications) {
      this.client.emit('notifications.email', {
        request_id,
        template_id,
        variables,
        to: { name, email },
      });
    }
    if (preferences.push_notifications) {
      this.client.emit('notifications.push', {
        request_id,
        template_id,
        to: { name, device_tokens },
        variables,
      });
    }
    return {
      success: true,
      data: { status: 'Notification sent' },
      message: 'Notification dispatched successfully',
      meta: null,
    };
  }
}
