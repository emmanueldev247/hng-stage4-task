import { ApiProperty } from '@nestjs/swagger';
import { UserPreferenceDto } from './user-preference.dto';
import { UserDto } from './user.dto';

export class UserContactDto extends UserDto {
  @ApiProperty({
    description: 'Device tokens registered for push notifications',
    example: ['abcd1234', 'efgh5678'],
    type: [String],
  })
  device_tokens: string[];

  @ApiProperty({
    description: 'User notification preferences',
    type: UserPreferenceDto,
  })
  preferences: UserPreferenceDto;
}
