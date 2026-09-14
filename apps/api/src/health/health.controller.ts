import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const ok = await this.prisma.isHealthy();
    return {
      status: 'ok',
      postgres: ok ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
