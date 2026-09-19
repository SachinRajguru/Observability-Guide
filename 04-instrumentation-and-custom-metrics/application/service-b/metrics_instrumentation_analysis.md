
## Service B — Distributed Tracing Analysis

> **File:** `metrics_instrumentation_analysis.md`

## Table of Contents

* [1. Purpose](#1-purpose)
* [2. Why Have Two Services?](#2-why-have-two-services)
* [3. Service Name](#3-service-name)
* [4. OpenTelemetry Initialization](#4-opentelemetry-initialization)
* [5. Automatic HTTP Instrumentation](#5-automatic-http-instrumentation)
* [6. Trace Context Propagation](#6-trace-context-propagation)
* [7. Resulting Trace](#7-resulting-trace)
* [8. Why Service B Does Not Need Custom Metrics](#8-why-service-b-does-not-need-custom-metrics)
* [9. Local Testing](#9-local-testing)
* [10. Kubernetes Testing](#10-kubernetes-testing)

## 1. Purpose

Service B is intentionally smaller than Service A.

Its main purpose is to demonstrate distributed tracing.

The request flow is:

```text
Client
  |
  v
Service A
  |
  | HTTP request
  v
Service B
```

## 2. Why Have Two Services?

Distributed tracing becomes meaningful when one request crosses service boundaries.

With one application:

```text
Client
  |
  v
Application
```

we can inspect application operations.

With multiple services:

```text
Client
  |
  v
Service A
  |
  v
Service B
```

we need a way to connect the operations.

A distributed trace provides that connection.

## 3. Service Name

Service B is registered with:

```text
instrumentation-service-b
```

This service name appears in the tracing backend.

Service A uses:

```text
instrumentation-service-a
```

Keeping unique service names allows us to distinguish the applications.

## 4. OpenTelemetry Initialization

The first important lines are:

```javascript
require('dotenv').config();
require('./tracing');
```

Only after tracing initialization do we load Express.

This ordering supports automatic instrumentation.

## 5. Automatic HTTP Instrumentation

OpenTelemetry automatically instruments supported Node.js HTTP operations.

When Service A calls:

```text
http://b-service.dev/hello
```

the outgoing HTTP operation can produce a span.

Service B can then create a server-side span for the incoming request.

## 6. Trace Context Propagation

A distributed trace needs a mechanism for passing trace information between services.

OpenTelemetry uses the W3C Trace Context standard.

The HTTP request can contain a header such as:

```text
traceparent
```

Conceptually:

```text
Service A

Trace ID: 1234
Span ID: AAAA
       |
       | traceparent
       v
Service B

Trace ID: 1234
Span ID: BBBB
```

The Trace ID remains associated with the overall operation while individual services create their own spans.

## 7. Resulting Trace

A tracing backend can represent the operation as:

```text
Trace: 1234

Service A
  |
  +-- HTTP request to Service B
          |
          +-- Service B /hello
```

This allows us to investigate:

* where latency occurred;
* which service handled the request;
* whether a downstream service failed;
* how services interact.

## 8. Why Service B Does Not Need Custom Metrics

This lab focuses custom Prometheus metrics primarily on Service A.

Service B's primary responsibility is demonstrating distributed tracing.

If application metrics are required later, Service B can be instrumented using the same `prom-client` approach used by Service A.

This keeps the initial lab easier to understand.

## 9. Local Testing

Run Service B:

```bash
npm start
```

Test:

```bash
curl http://localhost:3002/hello
```

Expected:

```text
Hello from Instrumentation Service B!
```

## 10. Kubernetes Testing

Inside the Kubernetes namespace:

```text
http://b-service.dev/hello
```

Service A uses this internal DNS name to communicate with Service B.

The `.dev` portion represents the Kubernetes namespace.

The complete service DNS name is effectively:

```text
b-service.dev.svc.cluster.local
```

Kubernetes DNS also allows the shorter:

```text
b-service.dev
```

when used from another namespace.
