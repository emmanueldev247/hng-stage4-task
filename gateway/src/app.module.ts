import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { JwtStrategy } from './modules/auth/strategies';
import { NotificationModule } from './modules/notification/notification.module';
import { CacheModule } from './cache/cache.module';
import { UserModule } from './modules/user/user.module';
import { TemplateModule } from './modules/template/template.module';
import { HealthModule } from './modules/health/health.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public', 'fcm'),
      serveRoot: '/fcm',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    NotificationModule,
    CacheModule,
    UserModule,
    TemplateModule,
    HealthModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
