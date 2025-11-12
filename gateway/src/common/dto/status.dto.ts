import { ApiProperty } from '@nestjs/swagger';

export class StatusDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Response message',
  })
  message: string;
}
