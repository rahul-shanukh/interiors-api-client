import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { trace } from '@opentelemetry/api';
import {
  TRACE_REQUEST_KEY,
  TRACE_RESPONSE_HEADER,
} from 'src/shared/trace/trace.constants';

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const activeSpan = trace.getActiveSpan();
    const spanContext = activeSpan?.spanContext();
    const traceId = spanContext?.traceId || 'no-trace-id';
    req[TRACE_REQUEST_KEY] = traceId;
    res.setHeader(TRACE_RESPONSE_HEADER, traceId);
    next();
  }
}
