//Backend\interiors-api-client\src\infrastructure\lifecycle\graceful-shutdown.service.ts

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class GracefulShutdownService implements OnModuleDestroy {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleDestroy() {
    console.log('🛑 Shutting down gracefully...');
    await this.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}
