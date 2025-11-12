import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationDto } from './dto/notification.dto';
import { NotificationService } from './notification.service';
import { RestAuthGuard } from '../auth/guards';
import { UserRequestInterface } from 'src/common/interfaces/user-req.interface';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @UseGuards(RestAuthGuard)
  sendNotification(
    @Body() notificationDto: NotificationDto,
    @Req() { user_id }: UserRequestInterface,
  ) {
    return this.notificationService.sendNotification(user_id, notificationDto);
  }
}
