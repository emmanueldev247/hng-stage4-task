import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TemplateEntity } from './db/template.entity';
import { ApiKeyGuard } from './auth/admin.guard';
import { HealthController } from './controllers/health.controller';
import { TemplatesController } from './controllers/templates.controller';
import {
  TemplatesService,
  TemplatesServiceContract,
} from './services/templates.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('TEMPLATE_DB_HOST', 'localhost'),
        port: parseInt(cfg.get<string>('TEMPLATE_DB_PORT', '5432')),
        username: cfg.get<string>('TEMPLATE_DB_USER', 'templates_dev'),
        password: cfg.get<string>('TEMPLATE_DB_PASSWORD', 'templates_dev_pass'),
        database: cfg.get<string>('TEMPLATE_DB_NAME', 'templates_db'),
        entities: [TemplateEntity],
        synchronize: cfg.get('TYPEORM_SYNCHRONIZE', 'true') === 'true',
        logging: cfg.get('TYPEORM_LOGGING', 'false') === 'true',
        keepConnectionAlive: true,
      }),
    }),
    TypeOrmModule.forFeature([TemplateEntity]),
  ],
  controllers: [HealthController, TemplatesController],
  providers: [
    ApiKeyGuard,
    TemplatesService,
    { provide: TemplatesServiceContract, useExisting: TemplatesService },
  ],
})
export class AppModule {}
