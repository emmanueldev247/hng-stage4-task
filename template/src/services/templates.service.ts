import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateEntity } from '../db/template.entity';
import {TemplateDto} from '../dtos/templates.dto'

// Abstraction used by the controller
export abstract class TemplatesServiceContract {
  abstract findByCode(
    template_code: string
  ): Promise<TemplateDto | null>;
}

@Injectable()
export class TemplatesService extends TemplatesServiceContract {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    @InjectRepository(TemplateEntity)
    private readonly repo: Repository<TemplateEntity>,
  ) {
    super();
  }

  async findByCode(
    template_code: string
  ): Promise<TemplateDto | null> {
    const row = await this.repo
      .createQueryBuilder('t')
      .where('t.template_code = :template_code', { template_code })
      .orderBy('t.version', 'DESC')
      .limit(1)
      .getOne();

    if (!row) return null;

    return {
      id: row.id,
      template_code: row.template_code,
      version: row.version,
      subject: row.subject,
      body: row.body,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }
}
