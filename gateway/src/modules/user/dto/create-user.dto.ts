import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  IsStrongPassword,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserPreferenceDto } from './user-preference.dto';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User email address',
    example: 'emmydee4321234@yopmail.com',
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
  @Type(() => UserPreferenceDto)
  @IsNotEmptyObject()
  @ApiProperty({
    description: 'Notification preferences for the user',
    type: UserPreferenceDto,
  })
  preferences: UserPreferenceDto;

  @IsStrongPassword()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Strong password for user account',
    example: 'Str0ngP@ssword!',
  })
  password: string;
}
