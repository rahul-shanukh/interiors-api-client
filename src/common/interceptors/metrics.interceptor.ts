import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Counter, Histogram } from 'prom-client';
import { GqlContextType } from '@nestjs/graphql';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly requestDuration: Histogram<string>;
  private readonly requestCount: Counter<string>;

  constructor() {
    // Histogram tracks the distribution of durations
    this.requestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5], // Time brackets in seconds
    });

    // Counter tracks the total number of requests
    this.requestCount = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 🚀 FIXED: Use 'context' instead of 'host', and return next.handle() instead of throwing an exception
    if (context.getType<GqlContextType>() === 'graphql') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const method = req.method;
    // Use req.route.path if available (e.g., /users/:id) rather than the raw URL to avoid metric explosion
    const route = req.route ? req.route.path : req.url;

    const timer = this.requestDuration.startTimer();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const status = res.statusCode;
          this.recordMetrics(method, route, status, timer);
        },
        error: (err) => {
          const status = err.status || 500;
          this.recordMetrics(method, route, status, timer);
        },
      }),
    );
  }

  private recordMetrics(
    method: string,
    route: string,
    status: number,
    timer: (labels?: any) => void,
  ) {
    const labels = { method, route, status: status.toString() };
    this.requestCount.inc(labels);
    timer(labels);
  }
}
