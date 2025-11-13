import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class UserPreference {
  @ApiPropertyOptional({
    example: true,
    description: 'Enable or disable email notifications',
  })
  @IsBoolean()
  email: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Enable or disable push notifications',
  })
  @IsBoolean()
  push: boolean;
}

export class PatchUserDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Updated name of the user',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Updated email address',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Updated user notification preferences',
    type: () => UserPreference,
  })
  @IsOptional()
  @Type(() => UserPreference)
  @ValidateNested()
  preferences?: UserPreference;
}
