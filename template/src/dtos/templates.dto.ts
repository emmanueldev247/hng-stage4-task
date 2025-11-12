import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TemplateDto {
  @ApiProperty() id!: string;
  @ApiProperty() template_code!: string;

  @ApiProperty({ minimum: 1, example: 1 })
  version!: number;

  @ApiProperty() subject!: string;
  @ApiProperty() body!: string;
  @ApiProperty() created_at!: string;
  @ApiProperty() updated_at!: string;
}

export class TemplateResponseDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ type: TemplateDto })
  data!: TemplateDto;

  @ApiProperty({ example: 'ok' })
  message!: string;
}

export class GetTemplateQueryDto {
  @ApiProperty({ example: 'welcome_email' })
  @IsString()
  template_code!: string;
}

export class CreateTemplateDto {
  @ApiProperty({ example: 'welcome_email' })
  @IsString()
  template_code!: string;

  @ApiProperty({ example: 'Welcome, {{name}}!' })
  @IsString()
  subject!: string;

  @ApiProperty({ example: 'Hi {{name}}, visit {{link}}' })
  @IsString()
  body!: string;
}

export class PatchTemplateDto {
  @ApiPropertyOptional({ example: 'Welcome (patched), {{name}}!' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: 'Hi {{name}}, here is your link: {{link}}' })
  @IsOptional()
  @IsString()
  body?: string;
}
