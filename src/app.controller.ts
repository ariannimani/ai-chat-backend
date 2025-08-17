import { Controller, Get, Head } from '@nestjs/common';
import { Public } from './config/guard/public.decorator';

@Controller()
export class AppController {
  @Get()
  @Public()
  getRoot() {
    return {
      message: 'AI Chat Backend API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        auth: '/auth',
        users: '/users',
        rooms: '/rooms',
        messages: '/messages',
        invitations: '/invitations',
        documentation: '/api-docs',
      },
    };
  }

  @Head()
  @Public()
  headRoot() {
    // HEAD requests should return empty body but same headers as GET
    // This is typically used for health checks by services like Render.com
    return;
  }

  @Get('health')
  @Public()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Head('health')
  @Public()
  headHealth() {
    // HEAD request for health check endpoint
    return;
  }
}
