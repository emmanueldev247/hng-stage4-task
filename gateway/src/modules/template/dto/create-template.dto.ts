import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({ example: 'welcome_email' })
  @IsString()
  @IsNotEmpty()
  template_code!: string;

  @ApiProperty({ example: 'Welcome, {{name}}!' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: 'Hi {{name}}, visit {{link}}' })
  @IsString()
  @IsNotEmpty()
  body!: string;
}
