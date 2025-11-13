import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from 'src/modules/user/dto';
import { TokenDto } from './token.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token and expiry',
    type: TokenDto,
  })
  access: TokenDto;

  @ApiProperty({
    description: 'Authenticated user information',
    type: UserDto,
  })
  user: UserDto;
}
