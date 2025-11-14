import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/cache/cache.service';
import { NotificationStatusDto } from './dto';

@Injectable()
export class NotificationStatusService {
  constructor(private readonly cache: CacheService) {}

  private key(id: string, channel: 'email' | 'push') {
    return `notif_status:${channel}:${id}`;
  }

  async saveStatus(
    channel: 'email' | 'push',
    dto: NotificationStatusDto,
  ): Promise<void> {
    // store for 2 days
    await this.cache.set(
      this.key(dto.notification_id, channel),
      dto,
      2 * 24 * 60 * 60,
    );
  }

  async getStatus(
    notification_id: string,
    channel?: 'email' | 'push',
  ): Promise<Record<string, NotificationStatusDto | null>> {
    if (channel) {
      const val = await this.cache.get<NotificationStatusDto>(
        this.key(notification_id, channel),
      );
      return {
        [channel]: val ?? null,
      };
    }
    // both
    const email = await this.cache.get<NotificationStatusDto>(
      this.key(notification_id, 'email'),
    );
    const push = await this.cache.get<NotificationStatusDto>(
      this.key(notification_id, 'push'),
    );
    return { email: email ?? null, push: push ?? null };
  }
}
