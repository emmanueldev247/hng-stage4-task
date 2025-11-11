// src/dtos/notification.dto.ts
import { IsEnum, IsObject, IsString, IsUUID, IsOptional, IsNumber } from 'class-validator';

export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
}

export enum NotificationStatus {
  DELIVERED = 'delivered',
  PENDING = 'pending',
  FAILED = 'failed',
}

export class UserDataDto {
  @IsString()
  name: string;

  @IsString()
  link: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}

export class NotificationRequestDto {
  @IsEnum(NotificationType)
  notification_type: NotificationType;

  @IsUUID()
  user_id: string;

  @IsString()
  template_code: string;

  @IsObject()
  variables: UserDataDto;

  @IsString()
  request_id: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class NotificationStatusDto {
  @IsString()
  notification_id: string;

  @IsEnum(NotificationStatus)
  status: NotificationStatus;

  @IsOptional()
  timestamp?: Date;

  @IsOptional()
  @IsString()
  error?: string;
}