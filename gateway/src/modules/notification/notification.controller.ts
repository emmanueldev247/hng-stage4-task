import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { NotificationDto } from './dto/notification.dto';
import { NotificationService } from './notification.service';
import { RestAuthGuard } from '../auth/guards';
import { UserRequestInterface } from 'src/common/interfaces/user-req.interface';
import { StatusDto } from 'src/common/dto';

@ApiTags('Notifications')
@UseGuards(RestAuthGuard)
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Send a notification to a user' })
  @ApiCreatedResponse({
    description: 'Notification dispatched successfully',
    type: StatusDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request, missing variables or invalid data',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  sendNotification(
    @Body() notificationDto: NotificationDto,
    @Req() { user }: UserRequestInterface,
  ) {
    return this.notificationService.sendNotification(user.id, notificationDto);
  }
}
