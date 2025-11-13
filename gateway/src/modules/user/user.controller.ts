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
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserClient } from 'src/clients';
import { RestAuthGuard } from '../auth/guards';
import { UserRequestInterface } from 'src/common/interfaces/user-req.interface';
import { DeviceTokenDto, PatchUserDto, UserDto } from './dto';
import { StatusDto } from 'src/common/dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userClient: UserClient) {}

  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @Patch('update')
  @ApiOperation({ summary: 'Update authenticated user details' })
  @ApiBody({ type: PatchUserDto })
  @ApiOkResponse({ description: 'User updated successfully', type: UserDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  patch(@Req() { user }: UserRequestInterface, @Body() data: PatchUserDto) {
    return this.userClient.updateUser(user.id, data);
  }

  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @Post('devices')
  @ApiOperation({ summary: 'Add a new device token for push notifications' })
  @ApiBody({ type: DeviceTokenDto })
  @ApiOkResponse({
    description: 'Device token added successfully',
    type: StatusDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  addToken(
    @Req() { user }: UserRequestInterface,
    @Body() data: DeviceTokenDto,
  ) {
    return this.userClient.addToken(user.id, data.device_token);
  }

  @Delete('devices')
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
    @Req() { user }: UserRequestInterface,
    @Param('token') token: string,
  ) {
    return this.userClient.removeToken(user.id, token);
  }
}
