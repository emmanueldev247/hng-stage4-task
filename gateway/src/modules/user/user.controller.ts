import {
  Body,
  Controller,
  Delete,
  Get,
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
import { PatchUserDto, TokenDto, UserDto } from './dto';
import { StatusDto } from 'src/common/dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userClient: UserClient) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get the currently authenticated user',
    description:
      'Returns profile information (email, name, preferences, and device tokens) for the logged-in user.',
  })
  @ApiOkResponse({
    description: 'Authenticated user profile retrieved successfully',
    type: UserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  async user(@Req() { user_id }: UserRequestInterface) {
    return this.userClient.getUserInfo(user_id);
  }

  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @Patch('update')
  @ApiOperation({ summary: 'Update authenticated user details' })
  @ApiBody({ type: PatchUserDto })
  @ApiOkResponse({ description: 'User updated successfully', type: UserDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  patch(@Req() { user_id }: UserRequestInterface, @Body() data: PatchUserDto) {
    return this.userClient.updateUser(user_id, data);
  }

  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @Post('devices')
  @ApiOperation({ summary: 'Add a new device token for push notifications' })
  @ApiBody({ type: TokenDto })
  @ApiOkResponse({
    description: 'Device token added successfully',
    type: StatusDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  addToken(@Req() { user_id }: UserRequestInterface, @Body() data: TokenDto) {
    return this.userClient.addToken(user_id, data.device_token);
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
    @Req() { user_id }: UserRequestInterface,
    @Param('token') token: string,
  ) {
    return this.userClient.removeToken(user_id, token);
  }
}
