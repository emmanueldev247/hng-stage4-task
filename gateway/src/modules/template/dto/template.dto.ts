import { ApiProperty } from '@nestjs/swagger';

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
