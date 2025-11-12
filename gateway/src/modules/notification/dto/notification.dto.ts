import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsString,
} from 'class-validator';

export class NotificationDto {
  @IsString()
  @IsNotEmpty()
  template_code: string;

  @IsObject()
  @IsNotEmptyObject()
  variables: Record<string, string>;
}
