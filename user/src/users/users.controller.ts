import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { AddDeviceDto } from "./dto/add-device.dto";
import { RemoveDeviceDto } from "./dto/remove-device.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      success: true,
      message: "User created successfully",
      data: {
        user_id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    };
  }

  @Post("validate-password")
  @HttpCode(HttpStatus.OK)
  async validatePassword(@Body() loginUserDto: LoginUserDto) {
    const user = await this.usersService.validatePassword(loginUserDto);
    return {
      success: true,
      message: "Password validated successfully",
      data: {
        user_id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  @Get(":id/contact")
  async getContactInfo(@Param("id") id: string) {
    const contactInfo = await this.usersService.getContactInfo(id);
    return {
      success: true,
      message: "User contact info retrieved",
      data: contactInfo,
    };
  }

  @Post(":id/devices")
  async addDevice(@Param("id") id: string, @Body() addDeviceDto: AddDeviceDto) {
    const device = await this.usersService.addDevice(id, addDeviceDto);
    return {
      success: true,
      message: "Device token added successfully",
      data: device,
    };
  }

  @Delete("devices")
  @HttpCode(HttpStatus.OK)
  async removeDevice(@Body() removeDeviceDto: RemoveDeviceDto) {
    return this.usersService.removeDevice(removeDeviceDto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    return {
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async remove(@Param("id") id: string) {
    await this.usersService.remove(id);
    return {
      success: true,
      message: `User with id ${id} successfully deleted`,
    };
  }
}
