// src/infrastructure/telemetry/otel.ts

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";

const rawRate = process.env.OTEL_TRACES_SAMPLER_ARG?.trim() || "0.1";
const samplingRate = Number(rawRate);

if (!Number.isFinite(samplingRate) || samplingRate < 0 || samplingRate > 1) {
  throw new Error("OTEL_TRACES_SAMPLER_ARG must be a number between 0 and 1");
}

const exporter = new OTLPTraceExporter({
  // Let the exporter append /v1/traces to OTEL_EXPORTER_OTLP_ENDPOINT,
  // or use OTEL_EXPORTER_OTLP_TRACES_ENDPOINT as a complete URL.
  // Prefer Grafana's standard OTLP headers; retain legacy credentials as a fallback.
  headers:
    !process.env.OTEL_EXPORTER_OTLP_HEADERS &&
    !process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS &&
    process.env.GRAFANA_INSTANCE_ID &&
    process.env.GRAFANA_API_KEY
      ? {
          Authorization: `Basic ${Buffer.from(
            `${process.env.GRAFANA_INSTANCE_ID}:${process.env.GRAFANA_API_KEY}`,
          ).toString("base64")}`,
        }
      : undefined,
});

export const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME || "backend",
  traceExporter: exporter,
  // NodeSDK configures batched log export from OTEL_LOGS_EXPORTER and the
  // shared OTLP endpoint/headers. OTEL_METRICS_EXPORTER enables metric export.
  // sdk.shutdown() flushes traces, logs and metrics.
  sampler: new ParentBasedSampler({
    // ✅ CHANGED: Use the validated variable here
    root: new TraceIdRatioBasedSampler(samplingRate),
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
      // Forward Pino records to the logs SDK and attach active trace/span IDs.
      "@opentelemetry/instrumentation-pino": {
        enabled: true,
        disableLogSending: false,
        disableLogCorrelation: false,
      },
    }),
  ],
});

sdk.start();
