import { Module } from '@nestjs/common';
import { PrometheusModule as NestPrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [
    NestPrometheusModule.register({
      controller: MetricsController, // <-- Point to your new controller
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  exports: [NestPrometheusModule],
})
export class PrometheusModule {}
