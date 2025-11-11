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

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  push_token?: string;

  @ValidateNested()
  @Type(() => UserPreference)
  @IsNotEmptyObject()
  preferences: UserPreference;

  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
}

class UserPreference {
  @IsBoolean()
  email: boolean;

  @IsBoolean()
  push: boolean;
}
