'use strict';

/*
 * OpenTelemetry initialization for Service B.
 *
 * Service B is the downstream application in our distributed
 * tracing example.
 *
 * Service B receives trace context propagated by Service A.
 *
 * Required initialization order:
 *
 * tracing.js
 *     |
 *     v
 * Express
 *
 * OpenTelemetry must be initialized before Express is loaded.
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

const traceEndpoint =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
  'http://localhost:4318/v1/traces';



// ============================================================
// SERVICE RESOURCE
// ============================================================
//
// The service name allows Jaeger to distinguish Service B from
// Service A.
//

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'instrumentation-service-b'
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
// HTTP instrumentation is responsible for the HTTP layer and
// trace-context propagation.
//
// Express instrumentation creates Express-specific spans.
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
  `OpenTelemetry tracing initialized for instrumentation-service-b. ` +
  `OTLP endpoint: ${traceEndpoint}`
);



// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

process.once('SIGTERM', async () => {
  try {
    await sdk.shutdown();

    console.log(
      'OpenTelemetry shutdown completed for instrumentation-service-b.'
    );
  } catch (error) {
    console.error(
      'OpenTelemetry shutdown failed for instrumentation-service-b:',
      error
    );
  } finally {
    process.exit(0);
  }
});