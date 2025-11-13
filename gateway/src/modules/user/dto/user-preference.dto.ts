import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UserPreferenceDto {
  @IsBoolean()
  @ApiProperty({
    description: 'Enable email notifications for the user',
    example: true,
  })
  email_notifications: boolean;

  @IsBoolean()
  @ApiProperty({
    description: 'Enable push notifications for the user',
    example: true,
  })
  push_notifications: boolean;
}
