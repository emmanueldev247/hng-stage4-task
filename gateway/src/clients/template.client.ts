import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheKeys } from 'src/cache/cache-keys';
import { Cached } from 'src/cache/cache.decorator';
import {
  TemplateListResponseDto,
  TemplateResponseDto,
} from 'src/modules/template/dto';
import {
  CreateTemplateDto,
  PatchTemplateDto,
  TemplateListQueryDto,
} from 'src/modules/template/dto';
import { BaseHttpClient } from './base-http.client';
import { CacheService } from 'src/cache/cache.service';
import { StatusDto } from 'src/common/dto';

@Injectable()
export class TemplateClient extends BaseHttpClient {
  constructor(
    config: ConfigService,
    private readonly cache: CacheService,
  ) {
    super(config, 'Template', 'TEMPLATE_SERVICE_URL');
  }
  private adminKey = this.config.get<string>('TEMPLATE_ADMIN_API_KEY');

  getHealth(): Promise<StatusDto> {
    return this.request<StatusDto>({
      method: 'GET',
      url: '/health',
    });
  }

  createTemplate(body: CreateTemplateDto): Promise<TemplateResponseDto> {
    return this.request<TemplateResponseDto>({
      method: 'POST',
      url: '/templates/',
      data: body,
      headers: {
        'x-api-key': this.adminKey,
      },
    });
  }

  @Cached('15m', (code: string) => CacheKeys.template(code))
  getTemplate(code: string): Promise<TemplateResponseDto> {
    return this.request<TemplateResponseDto>({
      method: 'GET',
      url: '/templates',
      params: {
        template_code: code,
      },
    });
  }

  @Cached('15m', (id: string) => CacheKeys.template(id))
  getTemplateById(id: string): Promise<TemplateResponseDto> {
    return this.request<TemplateResponseDto>({
      method: 'GET',
      url: `/templates/${id}`,
    });
  }

  async listTemplates(
    query: TemplateListQueryDto,
  ): Promise<TemplateListResponseDto> {
    return this.request<TemplateListResponseDto>({
      method: 'GET',
      url: '/templates/list',
      params: query,
    });
  }

  patchTemplate(
    id: string,
    body: PatchTemplateDto,
  ): Promise<TemplateResponseDto> {
    return this.request<TemplateResponseDto>({
      method: 'PATCH',
      url: `/templates/${id}`,
      data: body,
      headers: {
        'x-api-key': this.adminKey,
      },
    });
  }

  deleteTemplate(id: string): Promise<void> {
    return this.request({
      method: 'DELETE',
      url: `/templates/${id}`,
      headers: {
        'x-api-key': this.adminKey,
      },
    });
  }
}
