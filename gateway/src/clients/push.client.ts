import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseHttpClient } from './base-http.client';
import { StatusDto } from 'src/common/dto';

@Injectable()
export class PushClient extends BaseHttpClient {
  constructor(config: ConfigService) {
    super(config, 'Push', 'PUSH_SERVICE_URL');
  }

  getHealth(): Promise<StatusDto> {
    return this.request<StatusDto>({
      method: 'GET',
      url: '/health',
    });
  }
}
