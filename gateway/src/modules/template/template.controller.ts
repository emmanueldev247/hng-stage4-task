import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { TemplateClient } from 'src/clients';
import {
  CreateTemplateDto,
  GetTemplateQueryDto,
  PatchTemplateDto,
  TemplateListQueryDto,
  TemplateListResponseDto,
  TemplateResponseDto,
} from './dto';
import { StatusDto } from 'src/common/dto';

@ApiTags('Template')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly client: TemplateClient) {}

  /**
   * POST /api/v1/templates
   * Auto-versions per template_code.
   */
  @Post('')
  @ApiOperation({
    summary:
      'Create a new template version (auto-versioned per template_code) - Admin only',
  })
  @ApiCreatedResponse({
    description: 'Template version created',
    type: TemplateResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Missing or invalid fields',
  })
  async createTemplate(@Body() body: CreateTemplateDto) {
    return this.client.createTemplate(body);
  }

  /**
   * GET /api/v1/templates/
   * Paginated list of templates (all versions), optional filters.
   */
  @Get('')
  @ApiOperation({ summary: 'List templates (all versions) with pagination' })
  @ApiOkResponse({
    description: 'List returned successfully',
    type: TemplateListResponseDto,
  })
  listTemplates(@Query() query: TemplateListQueryDto) {
    return this.client.listTemplates(query);
  }

  /**
   * GET /api/v1/templates?template_code=welcome_v2
   * Returns the latest (highest version) by code.
   */
  @Get('get-by-code')
  @ApiOperation({ summary: 'Get latest template by template_code' })
  @ApiQuery({ name: 'template_code', required: true })
  @ApiOkResponse({
    description: 'Latest version of template',
    type: TemplateResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'template_code is required',
  })
  @ApiNotFoundResponse({
    description: 'Template not found',
  })
  async getByCode(@Query() { template_code }: GetTemplateQueryDto) {
    return this.client.getTemplate(template_code);
  }

  /**
   * GET /api/v1/templates/:id
   * Fetch a single template row by UUID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get template by id (UUID)' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiOkResponse({
    description: 'Template returned',
    type: TemplateResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Template not found',
  })
  async getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.client.getTemplateById(id);
  }

  /**
   * PATCH /api/v1/templates/:id
   * Creates a new version row with provided changes.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Patch a template by id (creates a new version) - Admin only',
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiOkResponse({
    description: 'New version created',
    type: TemplateResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'No fields to update provided',
  })
  @ApiNotFoundResponse({
    description: 'Template not found',
  })
  async patchTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: PatchTemplateDto,
  ) {
    return this.client.patchTemplate(id, body);
  }

  /**
   * DELETE /api/v1/templates/:id
   * Hard delete of that specific row (does not touch other versions).
   */
  @Delete('/:id')
  @ApiOperation({ summary: 'Delete a template by id - Admin only' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiOkResponse({
    type: StatusDto,
    description: 'Template deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Template not found',
  })
  async deleteTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<StatusDto> {
    await this.client.deleteTemplate(id);
    return { success: true, message: 'Deleted' };
  }
}
