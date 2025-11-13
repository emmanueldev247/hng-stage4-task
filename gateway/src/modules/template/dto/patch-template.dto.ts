import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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
