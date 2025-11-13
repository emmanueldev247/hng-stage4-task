import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheKeys } from 'src/cache/cache-keys';
import { Cached } from 'src/cache/cache.decorator';
import { TemplateDto, TemplateResponseDto } from 'src/modules/template/dto';
import {
  CreateTemplateDto,
  PatchTemplateDto,
  TemplateListQueryDto,
} from 'src/modules/template/dto';
import { BaseHttpClient } from './base-http.client';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class TemplateClient extends BaseHttpClient {
  constructor(
    config: ConfigService,
    private readonly cache: CacheService,
  ) {
    super(config, 'Template', 'TEMPLATE_SERVICE_URL');
  }
  async createTemplate(body: CreateTemplateDto): Promise<TemplateResponseDto> {
    const response = await this.request<TemplateResponseDto>({
      method: 'POST',
      url: '/templates/',
      data: body,
    });
    return response;
  }

  @Cached('15m', (code: string) => CacheKeys.template(code))
  async getTemplate(code: string): Promise<TemplateDto> {
    const response = await this.request<TemplateResponseDto>({
      method: 'GET',
      url: '/templates',
      params: {
        template_code: code,
      },
    });
    return response.data;
  }

  @Cached('15m', (id: string) => CacheKeys.template(id))
  async getTemplateById(id: string): Promise<TemplateDto> {
    const response = await this.request<TemplateResponseDto>({
      method: 'GET',
      url: `/templates/${id}`,
    });
    return response.data;
  }

  async listTemplates(query: TemplateListQueryDto): Promise<TemplateDto> {
    const response = await this.request<TemplateResponseDto>({
      method: 'GET',
      url: '/templates/list',
      params: query,
    });
    return response.data;
  }

  async patchTemplate(
    id: string,
    body: PatchTemplateDto,
  ): Promise<TemplateResponseDto> {
    const response = await this.request<TemplateResponseDto>({
      method: 'PATCH',
      url: `/templates/${id}`,
      data: body,
    });
    return response;
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.request({
      method: 'DELETE',
      url: `/templates/${id}`,
    });
  }
}
