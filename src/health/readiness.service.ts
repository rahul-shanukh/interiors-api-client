import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class ReadinessService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async isReady() {
    const isDbUp = this.connection.readyState === 1;

    return {
      status: isDbUp ? 'UP' : 'DOWN',
      mongodb: isDbUp ? 'UP' : 'DOWN',
    };
  }
}
