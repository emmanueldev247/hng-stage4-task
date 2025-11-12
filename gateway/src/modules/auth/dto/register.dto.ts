import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  IsStrongPassword,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UserPreference {
  @IsBoolean()
  @ApiProperty({
    description: 'Enable email notifications for the user',
    example: true,
  })
  email: boolean;

  @IsBoolean()
  @ApiProperty({
    description: 'Enable push notifications for the user',
    example: true,
  })
  push: boolean;
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Optional push token for the user device',
    example: 'faketoken123',
    required: false,
  })
  push_token?: string;

  @ValidateNested()
  @Type(() => UserPreference)
  @IsNotEmptyObject()
  @ApiProperty({
    description: 'Notification preferences for the user',
    type: UserPreference,
  })
  preferences: UserPreference;

  @IsStrongPassword()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Strong password for user account',
    example: 'Str0ngP@ssword!',
  })
  password: string;
}
