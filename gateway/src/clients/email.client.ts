import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseHttpClient } from './base-http.client';
import { StatusDto } from 'src/common/dto';

@Injectable()
export class EmailClient extends BaseHttpClient {
  constructor(config: ConfigService) {
    super(config, 'Email', 'EMAIL_SERVICE_URL');
  }

  getHealth(): Promise<StatusDto> {
    return this.request<StatusDto>({
      method: 'GET',
      url: '/health',
    });
  }
}
