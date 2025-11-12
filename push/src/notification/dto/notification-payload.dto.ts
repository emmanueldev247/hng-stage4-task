import { IsArray, IsString } from 'class-validator';

export class NotificationPayloadDto {
  @IsString()
  request_id: string;

  @IsArray()
  to: string[];

  @IsString()
  title: string;

  @IsString()
  message: string;
}
