import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaResolver } from './media.resolver';

@Module({
  // Providers are the classes NestJS will instantiate
  providers: [MediaService, MediaResolver],
  // Exporting MediaService allows other modules (like Catalog) to use it later
  exports: [MediaService],
})
export class MediaModule {}
