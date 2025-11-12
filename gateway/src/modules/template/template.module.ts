import { Module } from '@nestjs/common';
import { TemplatesController } from './template.controller';
import { TemplateClient } from 'src/clients';

@Module({
  controllers: [TemplatesController],
  providers: [TemplateClient],
})
export class TemplateModule {}
