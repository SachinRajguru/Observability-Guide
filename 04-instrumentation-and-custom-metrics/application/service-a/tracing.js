'use strict';

/*
 * OpenTelemetry initialization for Service A.
 *
 * This file must be loaded before Express and Axios.
 *
 * Why?
 *
 * OpenTelemetry automatic instrumentation patches supported
 * Node.js modules when they are loaded. Therefore, the
 * instrumentation must be registered before Express and Axios
 * are required by index.js.
 *
 * Service A uses:
 *
 * - HTTP instrumentation
 * - Express instrumentation
 * - OTLP protobuf trace exporter
 *
 * Distributed tracing flow:
 *
 * Client
 *   |
 *   v
 * Service A
 *   |
 *   | HTTP + trace context
 *   v
 * Service B
 */

const { NodeSDK } = require('@opentelemetry/sdk-node');

const {
  HttpInstrumentation
} = require('@opentelemetry/instrumentation-http');

const {
  ExpressInstrumentation
} = require('@opentelemetry/instrumentation-express');

const {
  OTLPTraceExporter
} = require('@opentelemetry/exporter-trace-otlp-proto');

const {
  resourceFromAttributes
} = require('@opentelemetry/resources');

const {
  ATTR_SERVICE_NAME
} = require('@opentelemetry/semantic-conventions');



// ============================================================
// OTLP TRACE ENDPOINT
// ============================================================
//
// Kubernetes example:
//
// OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://jaeger-collector.tracing:4318/v1/traces
//
// Local example:
//
// http://localhost:4318/v1/traces
//

const traceEndpoint =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
  'http://localhost:4318/v1/traces';



// ============================================================
// SERVICE RESOURCE
// ============================================================
//
// service.name identifies the application in Jaeger and other
// OpenTelemetry-compatible backends.
//

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'instrumentation-service-a'
});



// ============================================================
// OTLP TRACE EXPORTER
// ============================================================

const traceExporter = new OTLPTraceExporter({
  url: traceEndpoint
});



// ============================================================
// OPEN TELEMETRY SDK
// ============================================================
//
// We explicitly configure only the instrumentations required
// by this application instead of loading the complete
// auto-instrumentation bundle.
//
// HTTP instrumentation:
// - Incoming HTTP requests
// - Outgoing HTTP requests
// - Trace context propagation
//
// Express instrumentation:
// - Express routes
// - Express middleware spans
//

const sdk = new NodeSDK({
  resource,

  traceExporter,

  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation()
  ]
});



// ============================================================
// START OPEN TELEMETRY
// ============================================================

sdk.start();

console.log(
  `OpenTelemetry tracing initialized for instrumentation-service-a. ` +
  `OTLP endpoint: ${traceEndpoint}`
);



// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
//
// Flush pending telemetry before the process terminates.
//

process.once('SIGTERM', async () => {
  try {
    await sdk.shutdown();

    console.log(
      'OpenTelemetry shutdown completed for instrumentation-service-a.'
    );
  } catch (error) {
    console.error(
      'OpenTelemetry shutdown failed for instrumentation-service-a:',
      error
    );
  } finally {
    process.exit(0);
  }
});