import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // 1. Load the .env file and make it global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Connect to the database (TypeORM)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // We need ConfigModule to use ConfigService
      inject: [ConfigService], // Inject the ConfigService
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),

        // This is CRITICAL. It tells TypeORM to find all
        // files that end in .entity.ts
        entities: [__dirname + '/**/*.entity{.ts,.js}'],

        // This is your magic bullet for the sprint.
        // It auto-updates your database tables when you change
        // your entity files. No migrations needed.
        synchronize: true,
      }),
    }),

    // 3. The UsersModule (which you generated)
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
