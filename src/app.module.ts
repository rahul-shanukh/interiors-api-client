import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { TerminusModule } from "@nestjs/terminus";
import { GracefulShutdownService } from "./infrastructure/lifecycle/graceful-shutdown.service";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  Reflector,
} from "@nestjs/core";
import { RolesGuard } from "./common/guards/roles.guard";
import { QuotesModule } from "./modules/quotes/quotes.module";
import { PrometheusModule } from "./infrastructure/monitoring/prometheus.module";
import { MetricsInterceptor } from "./common/interceptors/metrics.interceptor";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { GqlThrottlerGuard } from "./common/guards/gql-throttler.guard";
import { LoggerModule } from "nestjs-pino";
import { TraceMiddleware } from "./common/middleware/trace.middleware";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { UploadsModule } from "./modules/uploads/module/uploads.module"; // ✅ import the UploadsModule
import { NotificationModule } from "./infrastructure/notifications/notification.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { colorize: true } }
            : undefined,
      },
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("MONGO_URI"),
        maxPoolSize: 10,
        maxIdleTimeMS: 60000,
        serverSelectionTimeoutMS: 5000,
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot({
      throttlers: [{ name: "default", ttl: 60, limit: 100 }],
    }),

    NotificationModule,
    TerminusModule,
    HealthModule,
    UploadsModule, // ✅ added
    QuotesModule,
    PrometheusModule,

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      playground: {
        settings: { "schema.polling.enable": false },
      },
      path: "/graphql",
      context: ({ req, res }) => ({ req, res }),
      formatError: (formattedError: any, error: any) => {
        const originalError = error?.originalError || error;
        return {
          message: formattedError.message,
          path: formattedError.path,
          extensions: {
            code:
              originalError?.errorCode ||
              originalError?.code ||
              formattedError.extensions?.code ||
              "INTERNAL_SERVER_ERROR",
            type: originalError?.constructor?.name || "Exception",
            traceId:
              originalError?.traceId ||
              formattedError.extensions?.traceId ||
              "no-trace-id",
          },
        };
      },
    }),

    CatalogModule,
  ],
  providers: [
    TraceMiddleware,
    Reflector,
    GracefulShutdownService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware).forRoutes("*");
  }
}
