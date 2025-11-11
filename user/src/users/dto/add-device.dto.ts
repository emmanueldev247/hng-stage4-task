import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class AddDeviceDto {
  @IsString()
  @IsNotEmpty()
  device_token: string;

  @IsString()
  @IsOptional() // e.g., 'android', 'ios', 'web'
  device_type?: string;
}