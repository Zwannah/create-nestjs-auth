import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        application: {
          status: 'healthy',
          uptime: process.uptime(),
        },
      },
    };
  }

  @Public()
  @Get('ready')
  checkReadiness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        application: {
          status: 'up',
          uptime: process.uptime(),
        },
      },
    };
  }

  @Public()
  @Get('live')
  checkLiveness() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      pid: process.pid,
    };
  }
}
