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
  @ApiProperty({ example: 'register_hng' })
  @IsString()
  template_code!: string;
}

export class CreateTemplateDto {
  @ApiProperty({ example: 'register_hng' })
  @IsString()
  template_code!: string;

  @ApiProperty({
    example: '🚀 Join HNG Internship, {{name}} — secure your spot',
  })
  @IsString()
  subject!: string;

  @ApiProperty({
    example:
      'Hey {{name}},<br/><br/>Ready to level up? Apply for the HNG Internship here: <a href="{{link}}" target="_blank" rel="noopener noreferrer">hng.tech/internship</a>.<br/><br/>You’ll gain real-world experience, work with mentors, and ship meaningful projects.<br/><br/>If the button doesn’t open, copy and paste this link:<br/>{{link}}<br/><br/>See you inside!<br/>HNG Team',
  })
  @IsString()
  body!: string;
}

export class PatchTemplateDto {
  @ApiPropertyOptional({ example: 'Welcome (patched), {{name}}!' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    example:
      'Hi {{name}}, welcome to team 20, please visit <a href="{{link}}" target="_blank" rel="noopener noreferrer">this link</a>.',
  })
  @IsOptional()
  @IsString()
  body?: string;
}
