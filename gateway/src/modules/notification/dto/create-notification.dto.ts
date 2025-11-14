import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { NotificationType } from './notification-type.enum';

export class CreateNotificationDto {
  @ApiPropertyOptional({
    enum: NotificationType,
    description:
      'Force a single channel. If omitted, user preferences decide which channels fire.',
    example: 'email',
  })
  @IsOptional()
  @IsEnum(NotificationType)
  notification_type?: NotificationType;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'User ID to notify. Used when JWT is missing/invalid; if both are present, the JWT subject wins.',
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiProperty({
    description: 'Template code (or key) to resolve subject/body/title.',
    example: 'register_hng',
  })
  @IsString()
  @IsNotEmpty()
  template_code!: string;

  @ApiProperty({
    description: 'Variables for template interpolation.',
    example: { name: 'John Doe', link: 'https://hng.tech/internship' },
  })
  @IsObject()
  variables!: Record<string, any>;

  @IsOptional()
  @IsString()
  request_id?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9)
  priority?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export type LegacyBody = {
  template_code: string;
  variables: Record<string, any>;
};
