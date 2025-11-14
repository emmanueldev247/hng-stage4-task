import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsString,
} from 'class-validator';

export class NotificationDto {
  @IsString()
  @IsNotEmpty({ message: 'template_code is required' })
  @ApiProperty({
    description: 'The unique code of the notification template to use',
    example: 'register_hng',
  })
  template_code: string;

  @IsObject({ message: 'variables must be an object' })
  @IsNotEmptyObject({}, { message: 'variables cannot be empty' })
  @ApiProperty({
    description:
      'Key-value pairs for template placeholders. All required placeholders must be provided.',
    example: { name: 'John Doe', link: 'https://hng.tech/internship' },
  })
  variables: Record<string, string>;
}
