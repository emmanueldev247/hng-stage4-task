import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetTemplateQueryDto {
  @ApiProperty({ example: 'register_hng' })
  @IsString()
  @IsNotEmpty()
  template_code!: string;
}
