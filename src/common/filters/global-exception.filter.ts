import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { GqlArgumentsHost, GqlContextType } from "@nestjs/graphql";
import { BaseException } from "../exceptions/base.exception";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}
  TRACE_REQUEST_KEY = "traceId";
  catch(exception: unknown, host: ArgumentsHost) {
    console.error("===== ORIGINAL EXCEPTION =====");
    if (exception instanceof Error) {
      console.error(exception.stack);
    } else {
      console.error(exception);
    }
    const { httpAdapter } = this.httpAdapterHost;

    // 1️⃣ GraphQL Protection (Keep your existing logic)
    // 1️⃣ GraphQL Handshake
    if (host.getType<GqlContextType>() === "graphql") {
      const gqlHost = GqlArgumentsHost.create(host); // ✅ correct
      const ctx = gqlHost.getContext();
      const req = ctx.req; // ✅ this is the real Express request with traceId

      const traceId = req?.[this.TRACE_REQUEST_KEY];

      if (exception instanceof Error) {
        (exception as any).traceId = traceId;

        if (exception instanceof BaseException) {
          (exception as any).code = exception.errorCode;
        }
      }

      throw exception;
    }
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    // 2️⃣ Default Fallback (Unknown errors)
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = "Something went wrong";
    let errorCode = "COMMON_001";

    // 3️⃣ Handle our custom Architecture Exceptions (Domain, App, Infra)
    if (exception instanceof BaseException) {
      status = exception.getStatus();
      message = exception.message;
      errorCode = exception.errorCode;
    }
    // 4️⃣ Handle built-in NestJS HttpExceptions (e.g., ValidationPipe 400s)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody: any = exception.getResponse();

      // Extract array of messages if it's a validation error, otherwise use string
      message =
        typeof responseBody === "object" && responseBody.message
          ? responseBody.message
          : exception.message;

      errorCode = "COMMON_002"; // Generic Validation/HTTP error code
    }

    // 5️⃣ Placeholder for TraceId (Phase 5 setup)
    const traceId = request[this.TRACE_REQUEST_KEY] || "temp-trace-id-1234";

    // 6️⃣ Construct your exact JSON Contract
    const errorResponse = {
      message,
      errorCode,
      statusCode: status,
      traceId, // This now matches your logs!
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 7️⃣ Send via HttpAdapter (Framework Agnostic)
    httpAdapter.reply(response, errorResponse, status);
  }
}
