import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserClient } from 'src/clients';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserClient],
})
export class UserModule {}
