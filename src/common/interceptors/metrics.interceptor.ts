import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { Counter, Histogram } from "prom-client";
import { metrics } from "@opentelemetry/api";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly requestDuration: Histogram<string>;
  private readonly requestCount: Counter<string>;
  private readonly meter = metrics.getMeter("interiors-http");
  private readonly otelRequestCount = this.meter.createCounter("interiors.http.requests", {
    description: "Completed HTTP requests handled by Nest controllers",
  });
  private readonly otelRequestDuration = this.meter.createHistogram("interiors.http.request.duration", {
    description: "HTTP response duration in seconds",
    unit: "s",
    advice: { explicitBucketBoundaries: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 1.5, 2, 5] },
  });

  constructor() {
    // Histogram tracks the distribution of durations
    this.requestDuration = new Histogram({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route", "status"],
      buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5], // Time brackets in seconds
    });

    // Counter tracks the total number of requests
    this.requestCount = new Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status"],
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    // Use req.route.path if available (e.g., /users/:id) rather than the raw URL to avoid metric explosion
    const route = req.route?.path || "unmatched";

    const timer = this.requestDuration.startTimer();

    // Finish runs once, after exception filters set the final HTTP status.
    const res = context.switchToHttp().getResponse();
    res.once("finish", () => this.recordMetrics(method, route, res.statusCode, timer));
    return next.handle();
  }

  private recordMetrics(
    method: string,
    route: string,
    status: number,
    timer: (labels?: Record<string, string>) => number,
  ) {
    const labels = { method, route, status: status.toString() };
    this.requestCount.inc(labels);
    const duration = timer(labels);
    this.otelRequestCount.add(1, labels);
    this.otelRequestDuration.record(duration, labels);
  }
}
