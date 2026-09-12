// backend/src/main.ts
import "./infrastructure/observability/telemetry/otel";
import { EventEmitter } from "events";
EventEmitter.defaultMaxListeners = 20;
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { createSession } from "./infrastructure/session/session.config";
import { TraceMiddleware } from "./common/middleware/trace.middleware";
import { Logger } from "nestjs-pino";
import { setupOpenApi } from "./infrastructure/docs/openapi.setup";
import { CacheService } from "./infrastructure/cache/cache.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  app.setGlobalPrefix("api/v1");

  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, "http://localhost:5173"]
    : ["http://localhost:5173"];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  const cacheService = app.get(CacheService);
  app.use(createSession(cacheService));

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  const traceMiddleware = app.get(TraceMiddleware);
  app.use(traceMiddleware.use.bind(traceMiddleware));

  setupOpenApi(app);

  const port = parseInt(process.env.PORT || "3000", 10);
  await app.listen(port, "0.0.0.0");
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
