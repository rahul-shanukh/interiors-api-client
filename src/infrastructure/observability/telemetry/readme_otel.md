It means instead of:

```text
Cloud Run / NestJS
      ↓
Grafana Cloud
```

Grafana recommends production as:

```text
Cloud Run / NestJS
      ↓
OTel Collector / Grafana Alloy
      ↓
Grafana Cloud
```

The **Collector/Alloy is a middle layer** that receives your traces first, then sends them to Grafana Cloud.

Why? It can handle things like **batching, retries, filtering, and buffering**, so your application isn't directly responsible for all telemetry delivery concerns.

For your current setup, **directly sending from NestJS to Grafana Cloud can still work**. The Collector/Alloy is an additional production architecture, not something required for OTel itself.

## Pino logs to Grafana Cloud Loki

The existing NodeSDK provides a batched OTLP log exporter. Pino instrumentation
forwards `nestjs-pino` records and adds the active `trace_id` and `span_id`.
Logs without an active span (for example startup messages) do not have a trace ID.
Plain `console.log` calls are not captured by Pino instrumentation; use the Nest
logger or Pino logger for application logs that should reach Loki.

Configure these settings before starting the backend:

```dotenv
OTEL_SERVICE_NAME=interiors-backend
OTEL_LOGS_EXPORTER=otlp
OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_ENDPOINT=https://<your-grafana-otlp-host>/otlp
OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic <Grafana-provided-encoded-credentials>"
```

The exporter appends `/v1/logs` to the shared base endpoint. The token needs
`logs:write` permission as well as `traces:write` for tracing. Keep the header in
Secret Manager when deploying to Cloud Run. The legacy `GRAFANA_INSTANCE_ID` /
`GRAFANA_API_KEY` fallback in `otel.ts` applies only to traces; logs use the
standard OTLP headers above (or `OTEL_EXPORTER_OTLP_LOGS_HEADERS`).

`logging/pino.config.ts` redacts authorization, cookie, API-key and set-cookie
headers before console output and log export. Do not put credentials in log
messages or other unredacted fields. Logs are independent of trace sampling:
an unsampled request can have a log even though its trace is not stored.
Nest's existing `sdk.shutdown()` call flushes both traces and logs.

From the backend directory, verify correlation and redaction without exporting:

```powershell
node --env-file=.env scripts/verify-otel-logs.cjs --local
```

To send one verification log and its trace to Grafana:

```powershell
node --env-file=.env scripts/verify-otel-logs.cjs
```

These development checks use the installed `ts-node` and the application's real
telemetry and logging configuration. They print export status and the trace ID,
without printing authentication credentials.

Open Grafana Explore, choose the Loki data source (usually ending in `-logs`),
select the last hour, and run:

```logql
{service_name="interiors-backend"} |= "grafana.logs.connection.check"
```

For request logs, call `/api/v1/health/live` and query:

```logql
{service_name="interiors-backend"}
```

Expand a log's structured metadata to find `trace_id`. Paste that ID into the
Tempo data source to view the matching trace. Direct clickable links between
Loki and Tempo require data-source correlation configuration in Grafana.

Reference: https://grafana.com/docs/grafana-cloud/observe-and-act/send-data/otlp/otlp-format-considerations/

## HTTP metrics to Grafana Cloud Mimir

The HTTP metrics interceptor records completed controller requests in both the
existing `prom-client` registry and OpenTelemetry. The local `/api/v1/metrics`
endpoint remains available. The prom-client registry itself is not exported by
the OTLP SDK; its process/CPU/memory metrics still require a Prometheus scraper
such as Alloy. This integration exports the HTTP counter and duration histogram.

Enable the NodeSDK's built-in metric reader before starting the application:

```dotenv
OTEL_METRICS_EXPORTER=otlp
OTEL_EXPORTER_OTLP_METRICS_PROTOCOL=http/protobuf
OTEL_METRIC_EXPORT_INTERVAL=15000
OTEL_METRIC_EXPORT_TIMEOUT=10000
```

Metrics reuse `OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS`.
The exporter appends `/v1/metrics` to the base endpoint. The token must include
`metrics:write`. Restart the backend after changing environment settings. No
additional packages or collector are required for this direct OTLP path.

The interceptor counts a response once at its `finish` event, after exception
filters set the final status. Labels are method, route template and status;
unmatched route labels never contain raw URLs or query strings. Requests rejected
before Nest interceptors run (such as guard rejection) and disconnected responses
that never finish are not counted by these custom controller metrics. Metrics
are independent of trace sampling.

Verify locally, then send a small verification batch:

```powershell
node --env-file=.env scripts/verify-otel-metrics.cjs --local
node --env-file=.env scripts/verify-otel-metrics.cjs
```

The verification uses the real interceptor, SDK and exporter. The local check
covers multiple observable emissions, final error statuses and unmatched routes.
The remote check sends one synthetic success labeled `/observability/verification`.

In Grafana Explore select the Prometheus data source, set the last 15 minutes,
call `/api/v1/health/live`, wait at least one export interval, and run:

```promql
{__name__=~"interiors_http_.*", job="interiors-backend"}
```

Grafana translates OTLP names to Prometheus names. With default translation,
the instruments become `interiors_http_requests_total` and
`interiors_http_request_duration_seconds` (with `_bucket`, `_count` and `_sum`).
If `service.namespace` is configured, `job` becomes `<namespace>/<service-name>`.

Request rate (requires multiple exports and traffic):

```promql
sum(rate(interiors_http_requests_total{job="interiors-backend"}[5m]))
```

Server error percentage:

```promql
100 * (
  sum(rate(interiors_http_requests_total{job="interiors-backend",status=~"5.."}[5m]))
  or vector(0)
) / sum(rate(interiors_http_requests_total{job="interiors-backend"}[5m]))
```

No traffic makes the error ratio undefined; do not interpret an empty or NaN
result as a successful health check.

95th-percentile response duration in seconds:

```promql
histogram_quantile(0.95,
  sum by (le) (rate(interiors_http_request_duration_seconds_bucket{job="interiors-backend"}[5m]))
)
```

For Cloud Run, configure these variables and the shared OTLP secret on the
service. Periodic exports need CPU time; validate delivery under the chosen
Cloud Run CPU allocation mode. Local ingestion does not verify production.
