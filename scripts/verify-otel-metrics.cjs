// Run with node --env-file=.env scripts/verify-otel-metrics.cjs [--local].
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createRequire } = require('node:module');
const local = process.argv.includes('--local');
process.env.OTEL_METRICS_EXPORTER = 'otlp';
process.env.OTEL_EXPORTER_OTLP_METRICS_PROTOCOL = 'http/protobuf';
process.env.OTEL_METRIC_EXPORT_INTERVAL = '60000';
process.env.OTEL_LOGS_EXPORTER = 'none';
require('ts-node').register({ transpileOnly: true });
const sdkRequire = createRequire(require.resolve('@opentelemetry/sdk-node'));
const { OTLPMetricExporter } = sdkRequire('@opentelemetry/exporter-metrics-otlp-proto');
const originalExport = OTLPMetricExporter.prototype.export;
let verified = false;
OTLPMetricExporter.prototype.export = function (resourceMetrics, callback) {
  try {
    const instruments = resourceMetrics.scopeMetrics.flatMap(scope => scope.metrics);
    const counter = instruments.find(metric => metric.descriptor.name === 'interiors.http.requests');
    const histogram = instruments.find(metric => metric.descriptor.name === 'interiors.http.request.duration');
    assert.ok(counter && histogram, 'HTTP instruments missing');
    assert.equal(counter.dataPoints.reduce((sum, point) => sum + point.value, 0), local ? 3 : 1);
    assert.equal(histogram.dataPoints.reduce((sum, point) => sum + point.value.count, 0), local ? 3 : 1);
    assert.ok(histogram.dataPoints.every(point => point.value.sum >= 0));
    if (local) {
      assert.ok(counter.dataPoints.some(point => point.attributes.status === '503'));
      assert.ok(counter.dataPoints.some(point => point.attributes.route === 'unmatched'));
    }
    verified = true;
    console.log('PASS: request count, duration, final status and bounded route labels');
  } catch (error) {
    process.exitCode = 1;
    console.log('FAIL: exported HTTP metrics did not match expected values');
    callback({ code: 1, error });
    return;
  }
  if (local) return callback({ code: 0 });
  originalExport.call(this, resourceMetrics, result => {
    console.log('Grafana metric export: ' + (result.code === 0 ? 'SUCCESS' : 'FAILED'));
    if (result.code !== 0) {
      process.exitCode = 1;
      console.log('Error code: ' + (result.error?.code ?? 'not provided'));
    }
    callback(result);
  });
};
// This check verifies metric export only; suppress incidental trace exports.
require('@opentelemetry/exporter-trace-otlp-proto').OTLPTraceExporter.prototype.export =
  (_spans, callback) => callback({ code: 0 });
const { sdk } = require('../src/infrastructure/observability/telemetry/otel');
const { MetricsInterceptor } = require('../src/common/interceptors/metrics.interceptor');
const { of, throwError } = require('rxjs');
const interceptor = new MetricsInterceptor();
function request(route, status, observable) {
  const response = new EventEmitter();
  response.statusCode = 200;
  const context = { switchToHttp: () => ({
    getRequest: () => ({ method: 'GET', route: route ? { path: route } : undefined, url: '/secret-user-id?token=private' }),
    getResponse: () => response,
  }) };
  interceptor.intercept(context, { handle: () => observable }).subscribe({ error() {} });
  response.statusCode = status;
  response.emit('finish');
  response.emit('finish'); // Must not double-count even if emitted twice.
}
request('/observability/verification', 200, of('first', 'second'));
if (local) {
  request('/observability/verification', 503, throwError(() => new Error('verification')));
  request(undefined, 404, of('unmatched'));
}
sdk.shutdown().then(() => {
  if (!verified) { console.log('FAIL: metric reader did not export'); process.exitCode = 1; }
}).catch(() => { console.log('Metric flush failed'); process.exitCode = 1; });
