import { IsString, IsNotEmpty } from 'class-validator';

export class RemoveDeviceDto {
  @IsString()
  @IsNotEmpty()
  device_token: string;
}