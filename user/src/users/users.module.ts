import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UserPreference } from "./entities/user-preference.entity";
import { UserDevice } from "./entities/user-device.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPreference, UserDevice])],

  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
