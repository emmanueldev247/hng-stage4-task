import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { RestAuthGuard } from '../auth/guards';
import { UserRequestInterface } from 'src/common/interfaces/user-req.interface';
import { StatusDto } from 'src/common/dto';
import {
  CreateNotificationDto,
  LegacyBody,
  NotificationPreference,
  NotificationStatusDto,
} from './dto';
import { OptionalRestAuthGuard } from '../auth/guards/optional-rest.guard';
import {} from '@nestjs/swagger';
import { CacheService } from 'src/cache/cache.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly cache: CacheService,
  ) {}

  @UseGuards(OptionalRestAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Send a notification (email and/or push)',
    description:
      'If `notification_type` is omitted, channels are selected by user preferences. Legacy payload `{ template_code, variables }` still works.',
  })
  @ApiBody({ type: CreateNotificationDto })
  @ApiCreatedResponse({
    description: 'Notification dispatched successfully',
    type: StatusDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request, missing variables or invalid data',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async sendNotification(
    @Body() body: CreateNotificationDto | LegacyBody,
    @Req() req: UserRequestInterface,
  ) {
    const jwtUserId = req?.user?.id;
    let effectiveUserId: string | undefined = jwtUserId;
    if ('user_id' in body && (body as CreateNotificationDto).user_id) {
      effectiveUserId = (body as CreateNotificationDto).user_id;
    }

    return this.notificationService.sendNotification(effectiveUserId, body);
  }

  @Post(':preference/status')
  @ApiOperation({
    summary: 'Record delivery status callback for a notification (Called by email or push service)',
  })
  @ApiParam({
    name: 'preference',
    enum: NotificationPreference,
    description: 'Notification channel',
  })
  @ApiBody({ type: NotificationStatusDto })
  @ApiOkResponse({ description: 'Status accepted' })
  async recordStatus(
    @Param('preference') preference: NotificationPreference,
    @Body() body: NotificationStatusDto,
  ) {
    const ts = body.timestamp ?? new Date().toISOString();
    const key = `notifstatus:${preference}:${body.notification_id}`;

    // store for 24h
    await this.cache.set(
      key,
      { ...body, timestamp: ts, preference },
      24 * 60 * 60,
    );

    return { success: true, message: 'Status accepted' };
  }

  @Get(':preference/status/:id')
  @ApiOperation({ summary: 'Get latest delivery status for a notification' })
  @ApiParam({
    name: 'preference',
    enum: NotificationPreference,
    description: 'Notification channel',
  })
  @ApiParam({
    name: 'id',
    description: 'notification_id (aka request_id)',
    example: 'req-12345',
  })
  @ApiOkResponse({
    description: 'Latest status record',
    schema: {
      example: {
        notification_id: 'req-12345',
        status: 'delivered',
        timestamp: '2025-11-14T00:00:00.000Z',
        error: null,
        preference: 'email',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'No status found' })
  async getStatus(
    @Param('preference') preference: NotificationPreference,
    @Param('id') id: string,
  ) {
    const key = `notifstatus:${preference}:${id}`;
    const value = await this.cache.get(key);

    if (!value) {
      throw new NotFoundException('No status found for this notification');
    }

    return { success: true, data: value };
  }
}
