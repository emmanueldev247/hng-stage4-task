import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { JwtStrategy } from './modules/auth/strategies';
import { NotificationModule } from './modules/notification/notification.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    NotificationModule,
    CacheModule,
  ],
  controllers: [AppController],
  providers: [JwtStrategy],
})
export class AppModule {}
