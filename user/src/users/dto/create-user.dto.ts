import {
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// 1. Create a class for nested 'preferences' object
class UserPreferenceDto {
  @IsBoolean()
  email_notifications: boolean;

  @IsBoolean()
  push_notifications: boolean;
}
// 2. DTO for the request body
export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  push_token?: string;

  // Tell class-validator to validate the nested object
  @ValidateNested()
  // Tell class-transformer to create an instance of UserPreferenceDto
  @Type(() => UserPreferenceDto)
  preferences: UserPreferenceDto;

  @IsString()
  @MinLength(8) // Minimum password length
  password: string;
}
