import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { PushTestDto } from './dto/push-test.dto';

@ApiTags('push')
@Controller('push')
export class NotificationHttpController {
  constructor(private readonly notification: NotificationService) {}

  @Post('test')
  @ApiOperation({ summary: 'Send a test push (direct HTTP -> Firebase)' })
  async sendTest(@Body() dto: PushTestDto) {
    const reqId = dto.request_id ?? `test-${Date.now()}`;
    await this.notification.handlePushNotification({
      request_id: reqId,
      to: dto.tokens,
      title: dto.title,
      body: dto.body,
    });
    return { success: true, request_id: reqId };
  }
}
