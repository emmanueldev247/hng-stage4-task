import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({ example: 'register_hng' })
  @IsString()
  @IsNotEmpty()
  template_code!: string;

  @ApiProperty({
    example: '🚀 Join HNG Internship, {{name}} — secure your spot',
  })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({
    example:
      'Hey {{name}},<br/><br/>Ready to level up? Apply for the HNG Internship here: <a href="{{link}}" target="_blank" rel="noopener noreferrer">hng.tech/internship</a>.<br/><br/>You’ll gain real-world experience, work with mentors, and ship meaningful projects.<br/><br/>If the button doesn’t open, copy and paste this link:<br/>{{link}}<br/><br/>See you inside!<br/>HNG Team',
  })
  @IsString()
  @IsNotEmpty()
  body!: string;
}
