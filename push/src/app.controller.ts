import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/health')
  getHealth() {
    return {
      status: 'OK',
      message: 'Server is running',
    };
  }
}
