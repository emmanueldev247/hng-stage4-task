import { UserDto } from 'src/common/dto';
import { TokenDto } from './token.dto';

export class AuthResponseDto {
  access: TokenDto;
  user: UserDto;
}
