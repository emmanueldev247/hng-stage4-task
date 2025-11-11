import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ResponseDto } from '../dtos/response.dto';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('/health')
  @ApiOperation({ summary: 'Service health' })
  @ApiOkResponse({
    description: 'Health check result',
    content: {
      'application/json': {
        examples: {
          healthy: {
            summary: 'DB up',
            value: {
              success: true,
              data: {
                status: 'ok',
                timestamp: '2025-11-11T14:59:30.123Z',
                service: 'template',
                checks: { db: 'up' },
              },
              message: 'Service is healthy',
            },
          },
          degraded: {
            summary: 'DB down (still 200 in this design)',
            value: {
              success: true,
              data: {
                status: 'degraded',
                timestamp: '2025-11-11T14:59:30.123Z',
                service: 'template',
                checks: { db: 'down' },
              },
              message: 'Database unreachable',
            },
          },
        },
      },
    },
  })
  async health() {
    let db_ok = false;
    try {
      await this.dataSource.query('SELECT 1;');
      db_ok = true;
    } catch {
      db_ok = false;
    }

    const payload = {
      status: db_ok ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'template',
      checks: {
        db: db_ok ? 'up' : 'down',
      },
    };

    return ResponseDto.success(
      payload,
      db_ok ? 'Service is healthy' : 'Database unreachable',
    );
  }
}
