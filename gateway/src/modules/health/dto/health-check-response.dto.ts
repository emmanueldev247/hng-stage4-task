import { ApiProperty } from '@nestjs/swagger';

class StatusDto {
  @ApiProperty({
    example: 'healthy | unhealthy',
    description: 'Status of the service',
  })
  status: string;
}

export class HealthCheckResponseDto {
  @ApiProperty({ type: StatusDto })
  user: StatusDto;

  @ApiProperty({ type: StatusDto })
  template: StatusDto;

  @ApiProperty({ type: StatusDto })
  email: StatusDto;

  @ApiProperty({ type: StatusDto })
  push: StatusDto;
}
