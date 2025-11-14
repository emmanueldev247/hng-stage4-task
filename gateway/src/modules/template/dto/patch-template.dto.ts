import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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
