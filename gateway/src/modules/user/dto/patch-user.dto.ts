import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class UserPreference {
  @IsBoolean()
  email: boolean;

  @IsBoolean()
  push: boolean;
}

export class PatchUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsOptional()
  @Type(() => UserPreference)
  @ValidateNested()
  preferences?: UserPreference;
}
