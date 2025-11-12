export class SimplifiedNotificationDto {
  request_id: string;
  to: string;
  subject: string;
  body: string;
}

export class NotificationStatusDto {
  notification_id: string;
  status: 'delivered' | 'pending' | 'failed';
  timestamp?: Date;
  error?: string;
}