import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Device token to add', example: 'faketoken123' })
  device_token: string;
}
