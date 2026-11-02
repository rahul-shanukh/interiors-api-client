// Run from the backend directory with node --env-file=.env scripts/verify-otel-logs.cjs.
// Add --local to validate correlation/redaction without sending telemetry.
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { Writable } = require('node:stream');

const local = process.argv.includes('--local');
process.env.NODE_ENV = 'production';
process.env.OTEL_LOGS_EXPORTER = 'otlp';
process.env.OTEL_EXPORTER_OTLP_LOGS_PROTOCOL = 'http/protobuf';
process.env.OTEL_TRACES_SAMPLER_ARG = '1';
process.env.OTEL_METRICS_EXPORTER = 'none';
require('ts-node').register({ transpileOnly: true });

const sdkRequire = createRequire(require.resolve('@opentelemetry/sdk-node'));
const { OTLPLogExporter } = sdkRequire('@opentelemetry/exporter-logs-otlp-proto');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const exportLogs = OTLPLogExporter.prototype.export;
const marker = 'grafana.logs.connection.check';
let observed = false;
let expectedTraceId;
OTLPLogExporter.prototype.export = function (records, callback) {
  try {
    const record = records.find(item => item.body === marker);
    if (record) {
      observed = true;
      assert.equal(record.spanContext.traceId, expectedTraceId);
      assert.equal(record.resource.attributes['service.name'], process.env.OTEL_SERVICE_NAME || 'backend');
      const serialized = JSON.stringify(record.attributes);
      assert.ok(serialized.includes('[REDACTED]'), 'Expected redacted request headers');
      assert.ok(!serialized.includes('verification-secret'), 'Credentials leaked into exported log');
      console.log('PASS: log contains the active trace ID and redacted credentials');
    }
  } catch (error) {
    process.exitCode = 1;
    console.log('FAIL: log correlation or redaction assertion');
    callback({ code: 1, error });
    return;
  }
  if (local) return callback({ code: 0 });
  return exportLogs.call(this, records, result => {
    console.log('Grafana log export: ' + (result.code === 0 ? 'SUCCESS' : 'FAILED'));
    if (result.code !== 0) {
      process.exitCode = 1;
      // Only report error codes; exporter messages may contain request details.
      console.log('Error code: ' + (result.error?.code ?? 'not provided'));
    }
    callback(result);
  });
};
if (local) OTLPTraceExporter.prototype.export = (_spans, callback) => callback({ code: 0 });

const { sdk } = require('../src/infrastructure/observability/telemetry/otel');
const { loggingOptions } = require('../src/infrastructure/observability/logging/pino.config');
// Pino is a peer dependency installed alongside nestjs-pino.
const pino = createRequire(require.resolve('nestjs-pino'))('pino');
const { trace } = require('@opentelemetry/api');
const logger = pino(loggingOptions.pinoHttp, new Writable({ write(_chunk, _encoding, done) { done(); } }));
trace.getTracer('interiors-log-verification').startActiveSpan(marker, span => {
  expectedTraceId = span.spanContext().traceId;
  logger.info({
    req: { headers: { authorization: 'verification-secret', cookie: 'verification-secret', 'x-api-key': 'verification-secret' } },
    res: { headers: { 'set-cookie': 'verification-secret' } },
  }, marker);
  console.log('Verification trace ID: ' + expectedTraceId);
  span.end();
});
sdk.shutdown().then(() => {
  if (!observed) {
    console.log('FAIL: Pino did not send the verification log to the SDK');
    process.exitCode = 1;
  }
}).catch(() => {
  console.log('Telemetry flush failed');
  process.exitCode = 1;
});
