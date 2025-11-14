import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationStatusDto } from './dto/notification-status.dto';
import { NotificationStatusService } from './notification-status.service';
import { StatusSecretGuard } from './status-secret.guard';

@ApiTags('Notification Status')
@Controller('notifications')
export class NotificationStatusController {
  constructor(private readonly statusSvc: NotificationStatusService) {}

  @Post('email/status')
  @UseGuards(StatusSecretGuard)
  @ApiOperation({ summary: 'Callback from Email service with delivery status' })
  @ApiBody({ type: NotificationStatusDto })
  async emailStatus(@Body() dto: NotificationStatusDto) {
    await this.statusSvc.saveStatus('email', dto);
    return { success: true };
  }

  @Post('push/status')
  @UseGuards(StatusSecretGuard)
  @ApiOperation({ summary: 'Callback from Push service with delivery status' })
  @ApiBody({ type: NotificationStatusDto })
  async pushStatus(@Body() dto: NotificationStatusDto) {
    await this.statusSvc.saveStatus('push', dto);
    return { success: true };
  }

  @Get('status/:notification_id')
  @ApiOperation({
    summary: 'Get status (email, push, or both) for a notification id',
  })
  @ApiQuery({ name: 'channel', required: false, enum: ['email', 'push'] })
  @ApiOkResponse({
    description: 'Status map',
    schema: {
      example: { email: null, push: { status: 'delivered', timestamp: '...' } },
    },
  })
  async getStatus(
    @Param('notification_id') id: string,
    @Query('channel') channel?: 'email' | 'push',
  ) {
    return this.statusSvc.getStatus(id, channel);
  }
}
