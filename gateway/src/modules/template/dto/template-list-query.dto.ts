import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class TemplateListQueryDto {
  @ApiPropertyOptional({
    description: 'Filter templates by template code',
    example: 'register_hng',
  })
  @IsString()
  @IsOptional()
  template_code?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination (starts from 1)',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}
