import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Connect lazily on first query; health check can probe separately.
    // Still attempt connect so misconfig fails early in logs without blocking forever.
    try {
      await this.$connect();
    } catch (err) {
      console.error('[Prisma] Initial connect failed (will retry on query):', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
