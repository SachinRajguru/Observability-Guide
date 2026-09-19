'use strict';

/*
 * Service B
 *
 * Service B is intentionally small.
 *
 * Its main purpose is to demonstrate how a downstream service
 * participates in a distributed trace created by Service A.
 */

require('dotenv').config();

// Initialize OpenTelemetry before loading Express.
require('./tracing');

const express = require('express');
const morgan = require('morgan');

const app = express();

const PORT = Number(process.env.PORT || 3002);

// HTTP access logging.
app.use(morgan('combined'));


// ============================================================
// HELLO ENDPOINT
// ============================================================
//
// Service A calls this endpoint.
//
// OpenTelemetry HTTP/Express instrumentation can create a span
// representing the request received by Service B.

app.get('/hello', (req, res) => {
  res.send('Hello from Instrumentation Service B!');
});


// ============================================================
// HEALTH ENDPOINT
// ============================================================

app.get('/healthy', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'instrumentation-service-b'
  });
});


// ============================================================
// SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(
    `Instrumentation Service B is running on port ${PORT}`
  );
});