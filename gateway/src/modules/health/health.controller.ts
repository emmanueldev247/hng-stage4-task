import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import {
  EmailClient,
  PushClient,
  TemplateClient,
  UserClient,
} from 'src/clients';
import { HealthCheckResponseDto } from './dto/health-check-response.dto';

@Controller('health')
export class HealthController {
  constructor(
    private readonly userClient: UserClient,
    private readonly templateClient: TemplateClient,
    private readonly emailClient: EmailClient,
    private readonly pushClient: PushClient,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check the health of all integrated services' })
  @ApiOkResponse({
    description: 'Health of all services retrieved successfully',
    type: HealthCheckResponseDto,
  })
  async getHealth(): Promise<HealthCheckResponseDto> {
    const [user, template, email, push] = await Promise.allSettled([
      this.userClient.getHealth(),
      this.templateClient.getHealth(),
      this.emailClient.getHealth(),
      this.pushClient.getHealth(),
    ]);

    return {
      user:
        user.status === 'fulfilled'
          ? { status: 'healthy' }
          : { status: 'unhealthy' },
      template:
        template.status === 'fulfilled'
          ? { status: 'healthy' }
          : { status: 'unhealthy' },
      email:
        email.status === 'fulfilled'
          ? { status: 'healthy' }
          : { status: 'unhealthy' },
      push:
        push.status === 'fulfilled'
          ? { status: 'healthy' }
          : { status: 'unhealthy' },
    };
  }
}
