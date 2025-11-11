import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- IMPORT
import { User } from './entities/user.entity'; // <-- IMPORT
import { UserPreference } from './entities/user-preference.entity'; // <-- IMPORT
import { UserDevice } from './entities/user-device.entity'; // <-- IMPORT

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPreference, UserDevice])],

  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
