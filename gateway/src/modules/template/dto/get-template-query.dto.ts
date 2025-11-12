import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetTemplateQueryDto {
  @ApiProperty({ example: 'welcome_email' })
  @IsString()
  @IsNotEmpty()
  template_code!: string;
}
