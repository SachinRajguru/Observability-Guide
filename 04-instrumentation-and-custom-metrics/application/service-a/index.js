'use strict';

/*
 * Service A
 *
 * This application demonstrates:
 *
 * 1. Express HTTP endpoints
 * 2. Application logging
 * 3. Prometheus custom metrics
 * 4. Request duration measurement
 * 5. Health checking
 * 6. Intentional application failures
 * 7. Service-to-service communication
 * 8. OpenTelemetry distributed tracing
 *
 * IMPORTANT:
 * tracing.js must be loaded before Express and Axios.
 */

// Load environment variables from .env when running locally.
require('dotenv').config();

// Initialize OpenTelemetry BEFORE loading Express and Axios.
require('./tracing');

const express = require('express');
const morgan = require('morgan');
const pino = require('pino');
const axios = require('axios');
const promClient = require('@prometheus-io/client');

const app = express();
const logger = pino();

const PORT = Number(process.env.PORT || 3001);

const SERVICE_B_URI =
  process.env.SERVICE_B_URI || 'http://localhost:3002';


// ============================================================
// LOGGING
// ============================================================

// Morgan creates HTTP access logs.
//
// Example:
//
// GET /healthy 200
//
// These logs are written to stdout and can later be collected
// by a Kubernetes logging agent such as Fluent Bit.
app.use(morgan('combined'));


// ============================================================
// PROMETHEUS METRICS
// ============================================================

// Collect standard Node.js process metrics.
//
// This gives us metrics such as:
// - process CPU
// - process memory
// - event-loop information
// - Node.js runtime information
//
// The custom application metrics below are still important because
// default process metrics do not tell us application-specific behavior.
promClient.collectDefaultMetrics();


// ------------------------------------------------------------
// Counter
// ------------------------------------------------------------
//
// A Counter represents a cumulative value.
//
// Example:
// 1 request
// 2 requests
// 3 requests
//
// It normally increases over time and can be used with PromQL
// functions such as rate() and increase().

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of completed HTTP requests received by Service A',
  labelNames: ['method', 'route', 'status_code']
});


// ------------------------------------------------------------
// Histogram
// ------------------------------------------------------------
//
// A Histogram records observations into buckets.
//
// We use it to measure HTTP request duration.
//
// Buckets are expressed in seconds.

const requestDurationHistogram = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});


// ------------------------------------------------------------
// Summary
// ------------------------------------------------------------
//
// A Summary records observations and exposes count, sum,
// and configured quantiles.
//
// Histograms are generally more useful for aggregating
// latency distributions across multiple application instances.

const requestDurationSummary = new promClient.Summary({
  name: 'http_request_duration_summary_seconds',
  help: 'HTTP request duration summary in seconds',
  labelNames: ['method', 'route', 'status_code'],
  percentiles: [0.5, 0.9, 0.95, 0.99]
});


// ------------------------------------------------------------
// Gauge
// ------------------------------------------------------------
//
// A Gauge can increase and decrease.
//
// Here it represents the number of requests currently being
// processed by Service A.

const activeRequestsGauge = new promClient.Gauge({
  name: 'active_requests',
  help: 'Number of HTTP requests currently being processed'
});


// ============================================================
// REQUEST METRICS MIDDLEWARE
// ============================================================

app.use((req, res, next) => {
  // Record the request start time.
  const startTime = process.hrtime.bigint();

  // Increase the number of active requests.
  activeRequestsGauge.inc();

  // res.on('finish') executes after the response has been sent.
  res.on('finish', () => {  
    // Calculate duration in seconds.
    const durationSeconds =
      Number(process.hrtime.bigint() - startTime) / 1e9;

    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: String(res.statusCode)
    };

    // Record the completed request.
    httpRequestCounter.inc(labels);

    // Record request duration in both metric types.
    requestDurationHistogram.observe(labels, durationSeconds);
    requestDurationSummary.observe(labels, durationSeconds);

    // The request is no longer active.
    activeRequestsGauge.dec();
  });

  next();
});


// ============================================================
// ROOT ENDPOINT
// ============================================================

app.get('/', (req, res) => {
  res.send('Hello from Instrumentation Service A!');
});


// ============================================================
// HEALTH ENDPOINT
// ============================================================

app.get('/healthy', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'instrumentation-service-a'
  });
});


// ============================================================
// SERVER ERROR ENDPOINT
// ============================================================
//
// This endpoint intentionally returns HTTP 500.
// It is useful for testing error metrics and logs.

app.get('/serverError', (req, res) => {
  logger.error({
    endpoint: '/serverError',
    message: 'Intentional server error generated for testing'
  });

  res.status(500).json({
    error: 'Intentional server error'
  });
});


// ============================================================
// NOT FOUND TEST ENDPOINT
// ============================================================

app.get('/notFound', (req, res) => {
  res.status(404).json({
    error: 'Intentional not-found response'
  });
});


// ============================================================
// LOGGING ENDPOINT
// ============================================================
//
// This endpoint generates an application log.

app.get('/logs', (req, res) => {
  logger.info({
    event: 'sample_application_log',
    message: 'Service A generated a test application log'
  });

  res.json({
    message: 'Application log generated successfully'
  });
});


// ============================================================
// CRASH ENDPOINT
// ============================================================
//
// WARNING:
// This endpoint intentionally terminates the Node.js process.
//
// It is included ONLY for testing Kubernetes container restart
// behavior and Prometheus alerting.
//
// Never expose an equivalent endpoint in a real production application.

app.get('/crash', (req, res) => {
  logger.error({
    event: 'intentional_crash',
    message: 'The application will terminate for alert testing'
  });

  res.status(500).json({
    message: 'The application process will terminate.'
  });

  setTimeout(() => {
    process.exit(1);
  }, 100);
});


// ============================================================
// EXAMPLE ENDPOINT
// ============================================================
//
// This endpoint demonstrates manually timing an operation.

app.get('/example', async (req, res) => {
  const startTime = process.hrtime.bigint();

  try {
    // Simulate a small asynchronous operation.
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    const durationSeconds =
      Number(process.hrtime.bigint() - startTime) / 1e9;

    logger.info({
      event: 'example_operation',
      duration_seconds: durationSeconds
    });

    res.json({
      message: 'Example operation completed',
      duration_seconds: durationSeconds
    });
  } catch (error) {
    logger.error({
      event: 'example_operation_failed',
      error: error.message
    });

    res.status(500).json({
      error: 'Example operation failed'
    });
  }
});


// ============================================================
// PROMETHEUS METRICS ENDPOINT
// ============================================================
//
// Prometheus scrapes this endpoint.
//
// Example:
// GET /metrics
//
// The response contains metrics in Prometheus exposition format.

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType);

    res.end(await promClient.register.metrics());
  } catch (error) {
    logger.error({
      event: 'metrics_endpoint_failed',
      error: error.message
    });

    res.status(500).end();
  }
});


// ============================================================
// SERVICE B COMMUNICATION
// ============================================================
//
// Service A calls Service B.
//
// OpenTelemetry HTTP instrumentation can propagate trace context
// through this HTTP request.
//
// The resulting trace can therefore connect:
//
// Client -> Service A -> Service B

app.get('/call-service-b', async (req, res) => {
  try {
    logger.info({
      event: 'calling_service_b',
      service_b_uri: SERVICE_B_URI
    });

    const response = await axios.get(
      `${SERVICE_B_URI}/hello`,
      {
        timeout: 5000
      }
    );

    res.json({
      service: 'instrumentation-service-a',
      downstream_response: response.data
    });
  } catch (error) {
    logger.error({
      event: 'service_b_call_failed',
      error: error.message
    });

    res.status(502).json({
      error: 'Service B could not be reached',
      details: error.message
    });
  }
});


// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((error, req, res, next) => {
  logger.error({
    event: 'unhandled_application_error',
    error: error.message,
    stack: error.stack
  });

  res.status(500).json({
    error: 'Internal server error'
  });
});


// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  logger.info({
    event: 'service_started',
    service: 'instrumentation-service-a',
    port: PORT,
    service_b_uri: SERVICE_B_URI
  });

  console.log(
    `Instrumentation Service A is running on port ${PORT}`
  );
});