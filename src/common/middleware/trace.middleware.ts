// Backend/interiors-api-client/src/common/middleware/trace.middleware.ts

import { Injectable, NestMiddleware } from "@nestjs/common";
import type {
  Request,
  Response,
  NextFunction,
} from "express-serve-static-core";
import { trace } from "@opentelemetry/api";
import { randomBytes } from "crypto";

import {
  TRACE_REQUEST_KEY,
  TRACE_RESPONSE_HEADER,
} from "../../shared/trace/trace.constants";

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 1. Retrieve trace context created by OpenTelemetry auto-instrumentation
    const activeSpan = trace.getActiveSpan();
    let traceId = activeSpan?.spanContext().traceId;

    // 2. Direct inline check enables TypeScript to narrow 'traceId' from 'string | undefined' to 'string'
    if (!traceId || traceId === "00000000000000000000000000000000") {
      traceId = randomBytes(16).toString("hex");
    }

    // 3. Attach traceId (now safely typed as string) to request and response header
    req[TRACE_REQUEST_KEY] = traceId;
    res.setHeader(TRACE_RESPONSE_HEADER, traceId);

    next();
  }
}
