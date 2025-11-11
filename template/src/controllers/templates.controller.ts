import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Query,
  ParseUUIDPipe,
  HttpCode,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiNoContentResponse,
  ApiHeader,
} from '@nestjs/swagger';

import { TemplateEntity } from '../db/template.entity';
import { ApiKeyGuard } from '../auth/admin.guard';
import { TemplatesServiceContract } from '../services/templates.service';
import {
  GetTemplateQueryDto,
  CreateTemplateDto,
  TemplateDto,
  TemplateResponseDto,
  PatchTemplateDto,
} from '../dtos/templates.dto';
import { ResponseDto } from '../dtos/response.dto';

@ApiTags('templates')
@Controller('/api/v1/templates')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesServiceContract,
    @InjectRepository(TemplateEntity)
    private readonly repo: Repository<TemplateEntity>,
  ) {}

  /**
   * GET /api/v1/templates/list
   * Paginated list of templates (all versions), optional filters.
   */
  @Get('/list')
  @ApiOperation({ summary: 'List templates (all versions) with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Page size (default 20, max 100)',
  })
  @ApiQuery({
    name: 'template_code',
    required: false,
    description: 'Filter by template_code',
  })
  @ApiOkResponse({
    description: 'List returned successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'c9c9f3d8-7d7d-45a1-bf6a-3b7e7c2d1d11',
            template_code: 'welcome_email',
            version: 3,
            subject: 'Welcome, {{name}}!',
            body: 'Hi {{name}}, here is your link: {{link}}',
            created_at: '2025-11-11T12:00:00.000Z',
            updated_at: '2025-11-11T12:00:00.000Z',
          },
        ],
        message: 'ok',
        meta: {
          total: 1,
          limit: 20,
          page: 1,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
      },
    },
  })
  async listTemplates(
    @Query('page') pageQ?: string,
    @Query('limit') limitQ?: string,
    @Query('template_code') templateCodeQ?: string,
  ) {
    let page = Number.parseInt(pageQ ?? '1', 10);
    let limit = Number.parseInt(limitQ ?? '20', 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const template_code = (templateCodeQ ?? '').trim();
    const qb = this.repo.createQueryBuilder('t');

    if (template_code) {
      qb.andWhere('t.template_code = :template_code', { template_code });
    }

    qb.orderBy('t.created_at', 'DESC').addOrderBy('t.version', 'DESC');

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data: TemplateDto[] = rows.map((r) => ({
      id: r.id,
      template_code: r.template_code,
      version: r.version,
      subject: r.subject,
      body: r.body,
      created_at: r.created_at.toISOString(),
      updated_at: r.updated_at.toISOString(),
    }));

    const total_pages = Math.max(1, Math.ceil(total / limit));
    const meta = {
      total,
      limit,
      page,
      total_pages,
      has_next: page < total_pages,
      has_previous: page > 1,
    };

    return ResponseDto.success(data, 'ok', meta);
  }

  /**
   * GET /api/v1/templates?template_code=welcome_v2
   * Returns the latest (highest version) by code.
   */
  @Get('/')
  @ApiOperation({ summary: 'Get latest template by template_code' })
  @ApiQuery({ name: 'template_code', required: true })
  @ApiOkResponse({
    description: 'Latest version of template',
    type: TemplateResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'template_code is required',
    schema: {
      example: {
        success: false,
        error: 'bad_request',
        message: 'template_code is required',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Template not found',
    schema: {
      example: {
        success: false,
        error: 'not_found',
        message: 'template not found',
      },
    },
  })
  async getByCode(@Query() query: GetTemplateQueryDto) {
    const template_code = (query.template_code || '').trim();

    if (!template_code) {
      throw new HttpException(
        ResponseDto.error('bad_request', 'template_code is required'),
        HttpStatus.BAD_REQUEST,
      );
    }

    const tpl: TemplateDto | null =
      await this.templatesService.findByCode(template_code);

    if (!tpl) {
      throw new HttpException(
        ResponseDto.error('not_found', 'template not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    return ResponseDto.success(tpl, 'ok');
  }

  /**
   * GET /api/v1/templates/:id
   * Fetch a single template row by UUID
   */
  @Get('/:id')
  @ApiOperation({ summary: 'Get template by id (UUID)' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiOkResponse({
    description: 'Template returned',
    type: TemplateResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Template not found',
    schema: {
      example: {
        success: false,
        error: 'not_found',
        message: 'template not found',
      },
    },
  })
  async getById(@Param('id', new ParseUUIDPipe()) id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new HttpException(
        ResponseDto.error('not_found', 'template not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    const dto: TemplateDto = {
      id: row.id,
      template_code: row.template_code,
      version: row.version,
      subject: row.subject,
      body: row.body,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };

    return ResponseDto.success(dto, 'ok');
  }

  /**
   * POST /api/v1/templates
   * Auto-versions per template_code.
   */
  @Post('/')
  @UseGuards(ApiKeyGuard)
  @ApiHeader({
    name: 'x-api-key',
    description: 'Admin API key',
    required: true,
  })
  @ApiOperation({
    summary: 'Create a new template version (auto-versioned per template_code) - Admin only',
  })
  @ApiCreatedResponse({
    description: 'Template version created',
    type: TemplateResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Missing or invalid fields',
    schema: {
      example: {
        success: false,
        error: 'bad_request',
        message: 'template_code, subject and body are required',
      },
    },
  })
  async createTemplate(@Body() body: CreateTemplateDto) {
    const template_code = (body.template_code || '').trim();
    const subject = (body.subject || '').trim();
    const templateBody = (body.body || '').trim();

    if (!template_code || !subject || !templateBody) {
      throw new HttpException(
        ResponseDto.error(
          'bad_request',
          'template_code, subject and body are required',
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    const latest = await this.repo
      .createQueryBuilder('t')
      .where('t.template_code = :template_code', { template_code })
      .orderBy('t.version', 'DESC')
      .limit(1)
      .getOne();

    const nextVersion = latest ? latest.version + 1 : 1;

    const row = this.repo.create({
      template_code,
      version: nextVersion,
      subject,
      body: templateBody,
    });
    const saved = await this.repo.save(row);

    const dto: TemplateDto = {
      id: saved.id,
      template_code: saved.template_code,
      version: saved.version,
      subject: saved.subject,
      body: saved.body,
      created_at: saved.created_at.toISOString(),
      updated_at: saved.updated_at.toISOString(),
    };

    return ResponseDto.success(dto, 'created');
  }

  /**
   * PATCH /api/v1/templates/:id
   * Creates a new version row with provided changes.
   */
  @Patch('/:id')
  @UseGuards(ApiKeyGuard)
  @ApiHeader({
    name: 'x-api-key',
    description: 'Admin API key',
    required: true,
  })
  @ApiOperation({ summary: 'Patch a template by id (creates a new version) - Admin only' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiOkResponse({
    description: 'New version created',
    type: TemplateResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'No fields to update provided',
    schema: {
      example: {
        success: false,
        error: 'bad_request',
        message: 'at least one of subject or body must be provided',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Template not found',
    schema: {
      example: {
        success: false,
        error: 'not_found',
        message: 'template not found',
      },
    },
  })
  async patchTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: PatchTemplateDto,
  ) {
    const original = await this.repo.findOne({ where: { id } });
    if (!original) {
      throw new HttpException(
        ResponseDto.error('not_found', 'template not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    if (!body.subject && !body.body) {
      throw new HttpException(
        ResponseDto.error(
          'bad_request',
          'at least one of subject or body must be provided',
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    const latest = await this.repo
      .createQueryBuilder('t')
      .where('t.template_code = :template_code', {
        template_code: original.template_code,
      })
      .orderBy('t.version', 'DESC')
      .limit(1)
      .getOne();

    const nextVersion = latest ? latest.version + 1 : 1;

    const newRow = this.repo.create({
      template_code: original.template_code,
      version: nextVersion,
      subject: body.subject?.trim() || original.subject,
      body: body.body?.trim() || original.body,
    });

    const saved = await this.repo.save(newRow);

    const dto: TemplateDto = {
      id: saved.id,
      template_code: saved.template_code,
      version: saved.version,
      subject: saved.subject,
      body: saved.body,
      created_at: saved.created_at.toISOString(),
      updated_at: saved.updated_at.toISOString(),
    };

    return ResponseDto.success(dto, 'version_created');
  }

  /**
   * DELETE /api/v1/templates/:id
   * Hard delete of that specific row (does not touch other versions).
   */
  @Delete('/:id')
  @UseGuards(ApiKeyGuard)
  @ApiHeader({
    name: 'x-api-key',
    description: 'Admin API key',
    required: true,
  })
  @ApiOperation({ summary: 'Delete a template by id - Admin only' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiNotFoundResponse({
    description: 'Template not found',
    schema: {
      example: {
        success: false,
        error: 'not_found',
        message: 'template not found',
      },
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    const { affected } = await this.repo.delete({ id });
    if (!affected) {
      throw new NotFoundException({
        success: false,
        error: 'not_found',
        message: 'template not found',
      });
    }
  }
}
