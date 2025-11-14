import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';

export class PushTestDto {
  @ApiProperty({ type: [String], description: 'FCM device tokens', example: ['<FCM_DEVICE_TOKEN>'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tokens: string[];

  @ApiProperty({ description: 'Notification title', example: 'Hello' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification body', example: 'This is a test push' })
  @IsString()
  body: string;

  @ApiProperty({ description: 'Optional request id', required: false, example: 'test-123' })
  @IsOptional()
  @IsString()
  request_id?: string;
}
