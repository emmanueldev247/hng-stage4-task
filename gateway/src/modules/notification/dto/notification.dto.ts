import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsString,
} from 'class-validator';

export class NotificationDto {
  @IsString()
  @IsNotEmpty()
  template_id: string;

  @IsObject()
  @IsNotEmptyObject()
  variables: object;
}
