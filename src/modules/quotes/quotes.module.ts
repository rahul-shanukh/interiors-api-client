import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuoteController } from './controllers/quote.controller';
import { QuoteService } from './application/services/quote.service';
import {
  Quote,
  QuoteSchema,
} from './infrastructure/persistence/mongo/quote.schema';
import { makeCounterProvider } from '@willsoto/nestjs-prometheus';
import { NotificationModule } from 'src/infrastructure/notifications/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quote.name, schema: QuoteSchema }]),
    NotificationModule,
  ],
  controllers: [QuoteController],
  providers: [
    QuoteService,
    makeCounterProvider({
      name: 'quotes_created_total',
      help: 'Total number of successfully created quotes',
      labelNames: ['status'],
    }),
  ],
  exports: [QuoteService],
})
export class QuotesModule {}
