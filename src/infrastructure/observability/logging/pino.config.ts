import type { Params } from "nestjs-pino";

export const loggingOptions: Params = {
  pinoHttp: {
    // Redact credentials before both console output and OpenTelemetry export.
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        'req.headers["x-api-key"]',
        'res.headers["set-cookie"]',
      ],
      censor: "[REDACTED]",
    },
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
};
