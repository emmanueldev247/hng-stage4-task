import { StatusDto } from 'src/common/dto';
import { TemplateDto } from './template.dto';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/dto/pagination.dto';

export class TemplateListResponseDto extends StatusDto {
  @ApiProperty({ type: [TemplateDto] })
  data: TemplateDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta?: PaginationMetaDto;
}
