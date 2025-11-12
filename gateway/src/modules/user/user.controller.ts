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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserClient } from 'src/clients';
import { RestAuthGuard } from '../auth/guards';
import { UserRequestInterface } from 'src/common/interfaces/user-req.interface';
import { PatchUserDto, AddTokenDto } from './dto';
import { StatusDto, UserDto } from 'src/common/dto';

@ApiTags('Users')
@UseGuards(RestAuthGuard)
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userClient: UserClient) {}

  @Patch('update')
  @ApiOperation({ summary: 'Update authenticated user details' })
  @ApiBody({ type: PatchUserDto })
  @ApiOkResponse({ description: 'User updated successfully', type: UserDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  patch(@Req() { user_id }: UserRequestInterface, @Body() data: PatchUserDto) {
    return this.userClient.updateUser(user_id, data);
  }

  @Post('device_tokens')
  @ApiOperation({ summary: 'Add a new device token for push notifications' })
  @ApiBody({ type: AddTokenDto })
  @ApiOkResponse({
    description: 'Device token added successfully',
    type: StatusDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  addToken(
    @Req() { user_id }: UserRequestInterface,
    @Body() data: AddTokenDto,
  ) {
    return this.userClient.addToken(user_id, data.token);
  }

  @Delete('device_tokens/:token')
  @ApiOperation({ summary: 'Remove a device token for push notifications' })
  @ApiParam({
    name: 'token',
    description: 'Device token to remove',
    example: 'faketoken123',
  })
  @ApiOkResponse({
    description: 'Device token removed successfully',
    type: StatusDto,
  })
  removeToken(
    @Req() { user_id }: UserRequestInterface,
    @Param('token') token: string,
  ) {
    return this.userClient.removeToken(user_id, token);
  }
}
