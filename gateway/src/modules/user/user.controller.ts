import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserClient } from 'src/clients';
import { RestAuthGuard } from '../auth/guards';
import { UserRequestInterface } from 'src/common/interfaces/user-req.interface';
import { PatchUserDto } from './dto/patch-user.dto';
@UseGuards(RestAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userClient: UserClient) {}

  @Patch('update')
  patch(@Req() { user_id }: UserRequestInterface, @Body() data: PatchUserDto) {
    return this.userClient.updateUser(user_id, data);
  }

  @Post('device_tokens')
  addToken(
    @Req() { user_id }: UserRequestInterface,
    @Body() data: PatchUserDto,
  ) {
    return this.userClient.updateUser(user_id, data);
  }

  @Delete('device_tokens/:token')
  removeToken(
    @Req() { user_id }: UserRequestInterface,
    @Param() token: string,
  ) {
    return this.userClient.removeToken(user_id, token);
  }
}
