import { Module } from '@nestjs/common';
import {
  EmailClient,
  PushClient,
  TemplateClient,
  UserClient,
} from 'src/clients';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  providers: [UserClient, TemplateClient, EmailClient, PushClient],
})
export class HealthModule {}
