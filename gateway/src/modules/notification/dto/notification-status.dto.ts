import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';

export enum NotificationPreference {
  email = 'email',
  push = 'push',
}

export enum NotificationStatus {
  delivered = 'delivered',
  pending = 'pending',
  failed = 'failed',
}

export class NotificationStatusDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-44665544000' })
  @IsString()
  notification_id: string;

  @ApiProperty({ enum: NotificationStatus, example: NotificationStatus.delivered })
  @IsEnum(NotificationStatus)
  status: NotificationStatus;

  @ApiProperty({ required: false, example: '2025-11-14T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  timestamp?: string;

  @ApiProperty({ required: false, example: 'Invalid token' })
  @IsOptional()
  @IsString()
  error?: string;
}
