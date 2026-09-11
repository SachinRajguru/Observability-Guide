
## Introduction to Observability, Monitoring, Logging & Tracing

> **File:** `01-introduction-to-observability.md`

> **Primary Platform:** Kubernetes / AWS EKS / Cloud-Native Environments
>
> **Focus:** Observability fundamentals, monitoring, metrics, logging, tracing, telemetry, reliability, and troubleshooting
>
> **Primary Concepts:** Monitoring, Metrics, Logging, Tracing, Observability, Three Pillars, SRE, SLI, SLO, SLA, Error Budget, Kubernetes Observability

## Table of Contents

1. [Learning Objectives](#1-learning-objectives)
2. [What Is Observability?](#2-what-is-observability)
3. [What Is a System?](#3-what-is-a-system)
4. [What Information Does Observability Provide?](#4-what-information-does-observability-provide)
5. [The Three Pillars of Observability](#5-the-three-pillars-of-observability)
6. [Metrics](#6-metrics)
7. [Logging](#7-logging)
8. [Tracing](#8-tracing)
9. [The What → Why → How Model](#9-the-what--why--how-model)
10. [Monitoring](#10-monitoring)
11. [Monitoring vs Observability](#11-monitoring-vs-observability)
12. [Why Monitoring?](#12-why-monitoring)
13. [Why Observability?](#13-why-observability)
14. [What Can Be Monitored?](#14-what-can-be-monitored)
15. [What Can Be Observed?](#15-what-can-be-observed)
16. [Real-World Resume Builder Example](#16-real-world-resume-builder-example)
17. [SLA, SLI, SLO and Error Budget](#17-sla-sli-slo-and-error-budget)
18. [Observability and SRE](#18-observability-and-sre)
19. [Bare Metal vs Kubernetes](#19-bare-metal-vs-kubernetes)
20. [Observability in Kubernetes](#20-observability-in-kubernetes)
21. [Observability Tools](#21-observability-tools)
22. [Developer vs DevOps/SRE Responsibilities](#22-developer-vs-devopssre-responsibilities)
23. [OpenTelemetry](#23-opentelemetry)
24. [Prometheus Client Libraries](#24-prometheus-client-libraries)
25. [Practical Lab — Build an Observability Mental Model](#25-practical-lab--build-an-observability-mental-model)
26. [Validation Checklist](#26-validation-checklist)
27. [Troubleshooting Guide](#27-troubleshooting-guide)
28. [Best Practices](#28-best-practices)
29. [Interview Questions and Answers](#29-interview-questions-and-answers)
30. [Summary](#30-summary)
31. [Final Cheat Sheet](#31-final-cheat-sheet)

## 1. Learning Objectives

By the end of this section, you should be able to:

* Define observability.
* Explain why observability is required.
* Explain what a system means in an observability context.
* Understand the three traditional pillars of observability:
  * Metrics
  * Logs
  * Traces
* Explain monitoring.
* Explain the difference between monitoring and observability.
* Understand the importance of historical telemetry.
* Explain the relationship between metrics, logs and traces.
* Apply the `What → Why → How` mental model.
* Identify what can be monitored and observed across infrastructure, applications, databases and networks.
* Explain observability requirements for Kubernetes.
* Compare bare-metal and Kubernetes observability.
* Explain SLA, SLI, SLO and error budgets.
* Explain the relationship between observability and SRE.
* Identify commonly used monitoring, logging and tracing tools.
* Explain ELK and EFK at a conceptual level.
* Explain the purpose of OpenTelemetry.
* Explain the purpose of Prometheus Client Libraries.
* Understand developer and DevOps/SRE responsibilities.
* Apply a basic observability troubleshooting methodology.
* Answer common observability interview questions.

> **Scope:** This section establishes the foundation required before implementing individual observability technologies. Detailed implementation belongs to the corresponding sections of the repository.

## 2. What Is Observability?

### 2.1 Definition

Observability is the ability to understand the internal state and behavior of a system by analyzing the data produced by that system.

In practical terms:

> Observability allows engineers to understand **what is happening, why it is happening, and how to investigate and troubleshoot it.**

A system can include:

```text
Application
     │
     ├── Infrastructure
     │
     ├── Networking
     │
     ├── Databases
     │
     └── External Dependencies
```

Therefore, observability is not limited to servers.

It can provide visibility into:

* Application behavior
* Infrastructure health
* Network behavior
* Database performance
* Request failures
* Latency
* Resource consumption
* Dependencies
* Distributed transactions

### 2.2 Observability Analogy

Think of a car.

A dashboard may tell you:

```text
Fuel        → 20%
Engine Temp → Normal
Speed       → 80 km/h
RPM         → 2,500
```

This tells you the current state.

Now imagine the engine suddenly stops.

The dashboard may tell you that something is wrong, but diagnosing the actual cause may require additional information such as:

* Engine logs
* Diagnostic codes
* Historical sensor readings
* The sequence of events before failure

A production application is similar.

```text
System
   │
   ├── Current state
   ├── Historical state
   ├── Events
   └── Request behavior
```

Observability gives engineers the information required to understand that behavior.

## 3. What Is a System?

When discussing observability, **system** means more than a single server.

Consider an application running on Kubernetes:

```text
                    User
                     │
                     ▼
               Load Balancer
                     │
                     ▼
                Kubernetes
                     │
       ┌─────────────┴─────────────┐
       │                           │
    Frontend                    Backend
       │                           │
       └─────────────┬─────────────┘
                     │
                     ▼
                  Database
```

The overall system can include:

* User
* Application
* Kubernetes cluster
* Nodes
* Pods
* Containers
* Services
* Load balancer
* Networking
* Database
* External services
* Cloud infrastructure

Observability should provide visibility across the relevant parts of this system.

## 4. What Information Does Observability Provide?

Suppose a Kubernetes node reports:

```text
CPU utilization       → 82%
Memory utilization    → 76%
Disk utilization      → 91%
Network traffic       → 850 Mbps
HTTP errors           → 5%
Request latency       → 320 ms
```

This helps answer:

> What is happening?

But this alone may not identify the root cause.

Suppose five HTTP requests failed.

We may need to determine:

```text
Why did they fail?
       │
       ▼
Which endpoint?
       │
       ▼
Which service?
       │
       ▼
Which application component?
       │
       ▼
Which dependency?
       │
       ▼
What was the actual error?
```

Finally:

> How can we troubleshoot and fix the problem?

This progression illustrates why observability requires multiple complementary signals.

## 5. The Three Pillars of Observability

The traditional observability model consists of:

```text
                  OBSERVABILITY
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
    Metrics           Logs           Traces
       │               │               │
      WHAT            WHY             HOW
```

The three pillars provide different types of telemetry.

| Pillar  | Primary Purpose           | Typical Questions                   |
| ------- | ------------------------- | ----------------------------------- |
| Metrics | Numerical measurements    | What is happening?                  |
| Logs    | Event/context information | What happened? What error occurred? |
| Traces  | Request/service flow      | Where did the request spend time?   |

> The `What → Why → How` model is a useful learning framework, not a strict technical rule. Modern observability systems correlate all three signals.

## 6. Metrics

### 6.1 Definition

A **metric** is a quantitative measurement of some aspect of a system collected over time.

Examples:

```text
CPU utilization      = 75%
Memory utilization   = 68%
HTTP requests        = 10,000
HTTP errors          = 25
Request latency      = 150 ms
```

Metrics are particularly useful for answering:

> What is happening?

### 6.2 Common Infrastructure Metrics

#### CPU

```text
CPU utilization = 90%
```

Potential concerns:

* Resource saturation
* Application slowdown
* Increased workload
* Scheduling pressure

However:

> High CPU does not automatically mean a failure.

CPU must be interpreted in context.

#### Memory

```text
Memory utilization = 95%
```

Possible concerns:

* Memory pressure
* Out-of-memory conditions
* Application memory leaks
* Kubernetes eviction

#### Disk

```text
Disk utilization = 95%
```

Possible concerns:

* Application failures
* Database failures
* Container/image issues
* Log storage exhaustion

#### Network

Common network metrics include:

* Bandwidth
* Packets
* Packet loss
* Network errors
* Latency
* Connections

### 6.3 Historical Metrics

One of the most important advantages of metrics is the ability to analyze historical behavior.

Suppose an application crashed at 10:00 AM.

At 10:05 AM:

```text
CPU = 30%
```

The current value alone may not explain the failure.

Historical data could show:

```text
09:50 → 45%
09:55 → 60%
09:58 → 75%
09:59 → 90%
10:00 → 100%
10:01 → Application failure
10:05 → 30%
```

Now the relationship becomes clearer.

#### Why Historical Data Matters

Historical telemetry helps answer:

* What happened before the incident?
* What changed?
* When did the problem begin?
* Did the problem gradually increase?
* Was the issue correlated with traffic?
* Did recovery occur after the failure?

## 7. Logging

### 7.1 Definition

Logging is the process of recording events generated by applications, infrastructure and other system components.

Typical log levels include:

```text
TRACE
DEBUG
INFO
WARN
ERROR
FATAL
```

Exact levels depend on the framework and implementation.

### 7.2 Example

Consider:

```text
POST /api/resume
```

The application may produce:

```text
INFO  Request received
INFO  User authenticated
DEBUG Loading resume template
DEBUG Calling database
ERROR Database connection failed
ERROR Resume generation failed
```

Metrics might tell us:

```text
HTTP 500 errors increased.
```

Logs may explain:

```text
Database connection failed.
```

### 7.3 Structured Logging

A production log should ideally contain structured information:

```json
{
  "timestamp": "2026-09-09T10:00:00Z",
  "level": "ERROR",
  "service": "resume-api",
  "request_id": "abc123",
  "message": "Database timeout"
}
```

Useful fields may include:

* Timestamp
* Log level
* Service
* Environment
* Request ID
* Trace ID
* Error
* Message

Structured logs make searching, filtering and correlation easier.

## 8. Tracing

### 8.1 Definition

Tracing tracks a request as it moves through multiple services or components.

A **trace** represents the complete request journey.

A **span** represents an individual operation within that trace.

```text
Trace
 │
 ├── Span: Load Balancer
 │
 ├── Span: Frontend
 │
 ├── Span: Backend
 │    ├── Span: Authentication
 │    └── Span: Business Logic
 │
 └── Span: Database Query
```

### 8.2 Distributed Tracing Example

Suppose a customer reports:

> "The Resume Builder is very slow."

Metrics:

```text
Average latency = 2 seconds
```

Logs:

```text
Backend request received
Database query started
Database query completed
```

Trace:

```text
Client
 │
 └── Load Balancer       20 ms
      │
      └── Frontend       50 ms
           │
           └── Backend   100 ms
                │
                └── DB  1830 ms
```

The trace identifies the database operation as the major latency contributor.

## 9. The What → Why → How Model

A useful mental model is:

| Question  | Primary Signal | Example                         |
| --------- | -------------- | ------------------------------- |
| **What?** | Metrics        | Error rate increased            |
| **Why?**  | Logs           | Database timeout                |
| **How?**  | Traces         | Request spent 1.8 seconds in DB |

```text
                 Incident
                    │
                    ▼
             WHAT happened?
                    │
                 Metrics
                    │
                    ▼
             WHY happened?
                    │
                   Logs
                    │
                    ▼
             HOW did it happen?
                    │
                  Traces
                    │
                    ▼
             Troubleshoot/Fix
```

#### Important Technical Clarification

The model is intentionally simplified.

In real systems:

* Metrics can help identify causes.
* Logs can contain timing information.
* Traces can reveal failures.
* Metrics, logs and traces can all contribute to root-cause analysis.

Therefore:

> Treat `What → Why → How` as a mental model, not a rigid technical boundary.

## 10. Monitoring

### 10.1 Definition

Monitoring is the continuous collection, visualization and evaluation of system signals to determine whether a system is operating within expected conditions.

Monitoring commonly focuses on:

* Metrics
* Thresholds
* Dashboards
* Alerts
* Health checks

Example:

```text
CPU > 80%
     │
     ▼
Alert triggered
     │
     ▼
Engineer notified
```

### 10.2 Monitoring Example

Suppose:

```text
CPU utilization = 91%
```

A monitoring system may generate:

```text
WARNING:
CPU utilization exceeded 80%
```

A dashboard may show:

```text
CPU
100% |                         *
 80% |                  * * * *
 60% |             * * *
 40% |        * * *
 20% | * * *
     +----------------------------
       09  10  11  12  13  14
```

Monitoring helps identify conditions that require attention.

## 11. Monitoring vs Observability

This is one of the most important interview topics.

### Simple Definition

> Monitoring helps detect and track known or expected conditions. Observability helps engineers understand system behavior and investigate problems, including unexpected ones.

| Category        | Monitoring                    | Observability                               |
| --------------- | ----------------------------- | ------------------------------------------- |
| Primary focus   | Known/expected conditions     | System behavior                             |
| Common signals  | Primarily metrics             | Metrics, logs, traces and related telemetry |
| Dashboards      | Common                        | Common                                      |
| Alerts          | Common                        | Common                                      |
| Historical data | Yes                           | Yes                                         |
| Logs            | May use logs                  | Important telemetry signal                  |
| Traces          | Usually not central           | Important telemetry signal                  |
| Investigation   | Limited by individual signals | Stronger with correlated telemetry          |
| Example         | CPU > 90%                     | Request failed because DB timed out         |

### Easy Interview Explanation

```text
Monitoring
    ↓
Something is wrong.

Observability
    ↓
Let's understand what happened.
```

## 12. Why Monitoring?

Monitoring helps organizations maintain:

* Health
* Performance
* Availability
* Reliability
* Capacity awareness
* Operational visibility

### 12.1 Detect Problems Early

Example:

```text
Memory:
60%
65%
70%
75%
80%
85%
```

An alert can be triggered before the service becomes unavailable.

### 12.2 Measure Performance

Monitor:

* Latency
* Throughput
* CPU
* Memory
* Error rate
* Request rate

### 12.3 Ensure Availability

Monitoring helps determine whether services are:

```text
UP
DOWN
DEGRADED
```

## 13. Why Observability?

Monitoring can tell us:

> "The application is slow."

Observability allows us to investigate:

```text
Why?
 │
 ├── CPU?
 ├── Memory?
 ├── Network?
 ├── Database?
 ├── External API?
 ├── Application code?
 └── Specific request?
```

### 13.1 Diagnose Issues

Observability helps identify the source of an issue.

### 13.2 Understand Behavior

Observability helps engineers understand application behavior under real workloads.

### 13.3 Improve Systems

Collected telemetry can be used to:

* Optimize performance
* Improve reliability
* Identify bottlenecks
* Improve capacity planning
* Reduce recurring incidents

## 14. What Can Be Monitored?

Observability and monitoring can cover multiple layers.

### 14.1 Infrastructure

Examples:

* CPU usage
* Memory usage
* Disk I/O
* Disk capacity
* Network traffic
* System load

### 14.2 Applications

Examples:

* Request rate
* Error rate
* Response time
* Throughput
* HTTP status codes
* Application exceptions

### 14.3 Databases

Examples:

* Query latency
* Connection count
* Connection pool utilization
* Transactions
* Lock contention
* Replication health

### 14.4 Network

Examples:

* Latency
* Packet loss
* Bandwidth
* Network errors
* Connections

### 14.5 Security

Examples:

* Unauthorized access attempts
* Authentication failures
* Firewall events
* Security events
* Vulnerability findings

## 15. What Can Be Observed?

The traditional three pillars are:

```text
                 System
                   │
       ┌───────────┼───────────┐
       │           │           │
    Metrics       Logs       Traces
       │           │           │
       ▼           ▼           ▼
   Numerical    Events      Request
   data         records     flow
```

Modern observability can additionally incorporate:

* Profiles
* Continuous profiling
* Events
* Kubernetes metadata
* Infrastructure topology
* eBPF-derived telemetry

These extend the traditional model rather than replacing the three pillars.

## 16. Real-World Resume Builder Example

Consider an online Resume Builder application deployed on Kubernetes running on AWS.

A simplified architecture:

```text
                         Internet
                            │
                            ▼
                    AWS Load Balancer
                            │
                            ▼
                     Kubernetes / EKS
                            │
             ┌──────────────┴──────────────┐
             │                             │
        Frontend Service              Backend Service
             │                             │
             └──────────────┬──────────────┘
                            │
                            ▼
                         Database
```

Suppose the business defines:

```text
Platform availability target: 99.9%

API performance objective:
99.95% of qualifying requests should
return successfully within 30 ms.
```

These values are illustrative. Actual targets must be defined by the business and engineering teams.

The organization must continuously measure whether these objectives are being achieved.

This requires reliable telemetry.

## 17. SLA, SLI, SLO and Error Budget

These concepts are important in reliability engineering.

### 17.1 SLA — Service Level Agreement

An **SLA** is a formal agreement with a customer defining expected service levels and potentially consequences if those expectations are not met.

Example:

```text
Service availability = 99.9%
```

### 17.2 SLO — Service Level Objective

An **SLO** is a reliability or performance target.

Example:

```text
Availability SLO = 99.9%
```

### 17.3 SLI — Service Level Indicator

An **SLI** is the actual measurement used to evaluate an SLO.

Example:

```text
Successful requests
--------------------
Total qualifying requests
```

If:

```text
9995 / 10000 = 99.95%
```

the measured SLI is:

```text
99.95%
```

### 17.4 Error Budget

For:

```text
SLO = 99.9%
```

the conceptual permitted unreliability is:

```text
0.1%
```

This is the error budget over the relevant measurement period.

### Important Clarification

An error budget is not inherently a fixed number of requests.

It depends on:

* SLO
* Measurement window
* SLI
* Reliability objective
* Measurement method

Therefore, examples involving five failed requests should be treated only as simplified illustrations.

## 18. Observability and SRE

Strong observability is particularly important in **Site Reliability Engineering (SRE)**.

SRE teams commonly care about:

* Reliability
* Availability
* Latency
* Error rates
* Capacity
* Incident response
* SLO compliance

Consider:

```text
SLO = 99.9%

Current availability
       │
       ▼
    99.95%
       │
       ▼
    Healthy
```

Later:

```text
99.95%
   ↓
99.92%
   ↓
99.90%
   ↓
99.85%
```

The team needs fast feedback.

Observability provides telemetry that helps determine:

* What changed?
* When did it change?
* Which component was affected?
* Is the SLO being violated?
* What caused the degradation?

## 19. Bare Metal vs Kubernetes

Observability becomes more complex as infrastructure becomes more dynamic and distributed.

### 19.1 Bare-Metal Servers

A simplified environment:

```text
Physical Server
      │
      ├── OS
      │
      ├── Application
      │
      └── Logs
```

Characteristics:

* Direct access to hardware
* Relatively stable hosts
* Fewer abstraction layers
* Simpler topology
* Easier direct host/application correlation

### 19.2 Kubernetes

A Kubernetes environment may look like:

```text
                    Cluster
                       │
          ┌────────────┼────────────┐
          │            │            │
        Node         Node         Node
          │            │            │
        Pods         Pods         Pods
          │            │            │
      Containers   Containers   Containers
          │
       Services
          │
     Applications
          │
  External Systems
```

Pods can:

* Start
* Stop
* Restart
* Scale
* Move between nodes

### 19.3 Kubernetes Monitoring Challenges

#### Dynamic Environment

Pods are often ephemeral.

#### Dynamic Scaling

Workload counts can change automatically.

#### Distributed Architecture

A single request can cross several services.

#### Multiple Layers

```text
Cloud
  ↓
Cluster
  ↓
Node
  ↓
Pod
  ↓
Container
  ↓
Application
  ↓
Database
```

#### Correlation

Useful metadata includes:

* Namespace
* Pod
* Container
* Service
* Node
* Cluster
* Application
* Environment
* Request ID
* Trace ID

## 20. Observability in Kubernetes

Kubernetes observability generally requires multiple telemetry sources:

```text
                   Kubernetes
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      Metrics         Logs          Traces
        │              │              │
        ▼              ▼              ▼
    Prometheus     Fluent Bit       OTel
        │              │              │
        ▼              ▼              ▼
     Grafana     Elasticsearch      Jaeger
```

The conceptual flow is:

```text
Application
    │
    ├── Metrics ──────► Metrics Platform
    │
    ├── Logs ─────────► Logging Platform
    │
    └── Traces ───────► Tracing Platform
```

Detailed deployment and configuration belong to the relevant implementation sections of the repository.

## 21. Observability Tools

### 21.1 Monitoring and Metrics Tools

| Tool       | Primary Role                      | Status                   |
| ---------- | --------------------------------- | ------------------------ |
| Prometheus | Metrics collection/querying       | Current, widely used     |
| Grafana    | Visualization/dashboards          | Current, widely used     |
| Nagios     | Infrastructure/service monitoring | Mature                   |
| Zabbix     | Infrastructure monitoring         | Mature and actively used |
| PRTG       | Network/infrastructure monitoring | Commercial               |

### 21.2 Logging Tools

| Tool          | Primary Role                           | Status                       |
| ------------- | -------------------------------------- | ---------------------------- |
| Elasticsearch | Search, indexing and analytics         | Current                      |
| Logstash      | Log processing/ingestion               | Mature                       |
| Fluent Bit    | Lightweight collection/forwarding      | Current, Kubernetes-friendly |
| Kibana        | Search and visualization               | Current                      |
| Splunk        | Enterprise log analytics/observability | Commercial                   |

### 21.3 Tracing Tools

| Tool          | Primary Role                         | Status                       |
| ------------- | ------------------------------------ | ---------------------------- |
| Jaeger        | Distributed tracing                  | Current                      |
| Zipkin        | Distributed tracing                  | Mature                       |
| OpenTelemetry | Telemetry instrumentation/collection | Current/recommended standard |

### 21.4 Full-Stack Observability Platforms

Examples include:

* New Relic
* Dynatrace
* Datadog
* Splunk

These platforms can provide combinations of:

* Infrastructure monitoring
* Application monitoring
* Logs
* Traces
* Dashboards
* Alerting
* Analytics

### 21.5 ELK vs EFK

#### ELK

```text
Logs
 │
 ▼
Logstash
 │
 ▼
Elasticsearch
 │
 ▼
Kibana
```

ELK:

```text
Elasticsearch
Logstash
Kibana
```

#### EFK

```text
Logs
 │
 ▼
Fluent Bit
 │
 ▼
Elasticsearch
 │
 ▼
Kibana
```

EFK:

```text
Elasticsearch
Fluent Bit
Kibana
```

#### Why Fluent Bit?

Fluent Bit is commonly preferred in containerized environments because it is lightweight and designed for efficient log collection and forwarding.

## 22. Developer vs DevOps/SRE Responsibilities

A common interview question is:

> Who owns observability?

The correct answer is:

> Observability is a shared responsibility.

### 22.1 Developer Responsibilities

Developers commonly handle application-level instrumentation:

```text
Application
    │
    ├── Metrics
    ├── Logs
    └── Traces
```

Responsibilities can include:

* Business metrics
* Application metrics
* Structured logging
* Error logging
* Trace instrumentation
* Request identifiers
* Trace context propagation

### 22.2 DevOps/SRE Responsibilities

DevOps/SRE teams commonly operate the observability platform.

Responsibilities may include:

* Deploying monitoring systems
* Deploying logging systems
* Deploying tracing systems
* Managing dashboards
* Managing alerts
* Managing retention
* Securing telemetry
* Scaling observability infrastructure
* Managing integrations
* Supporting incident investigation

Conceptually:

```text
Developer Instrumentation
          │
          ▼
   Observability Platform
          │
    ┌─────┼─────┐
    ▼     ▼     ▼
 Metrics Logs  Traces
```

### 22.3 Why Collaboration Is Required

#### Scenario 1 — Platform exists, application isn't instrumented

```text
Prometheus
    │
    ▼
No useful application telemetry
```

#### Scenario 2 — Application is instrumented, platform doesn't exist

```text
Application
    │
    ▼
Telemetry generated
    │
    ▼
No collection/storage/visualization
```

Therefore:

```text
Developer
    +
DevOps/SRE
    =
Effective Observability
```

## 23. OpenTelemetry

### 23.1 Definition

OpenTelemetry (OTel) is a vendor-neutral observability framework and ecosystem for generating, collecting and exporting telemetry.

It provides APIs, SDKs and components for:

* Metrics
* Logs
* Traces

OpenTelemetry is not simply a monitoring utility.

It provides a common approach to telemetry instrumentation and collection.

### 23.2 Conceptual Architecture

```text
                Application
                     │
          ┌──────────┼──────────┐
          │          │          │
       Metrics      Logs      Traces
          │          │          │
          └──────────┼──────────┘
                     │
               OpenTelemetry
                     │
               OTel Collector
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    Metrics        Logs        Tracing
    Backend       Backend      Backend
```

OpenTelemetry helps reduce tight coupling between application instrumentation and a specific observability vendor or backend.

### 23.3 Current vs Legacy Context

Older systems often use vendor-specific or backend-specific instrumentation.

A modern approach increasingly favors OpenTelemetry for standardized instrumentation and telemetry pipelines.

This does not mean existing tools such as Jaeger, Prometheus or Elasticsearch become obsolete.

Instead:

```text
Application
     │
     ▼
OpenTelemetry
     │
     ├── Metrics Backend
     ├── Logging Backend
     └── Tracing Backend
```

OpenTelemetry can coexist with existing observability platforms.

## 24. Prometheus Client Libraries

Prometheus Client Libraries allow applications to expose Prometheus-compatible metrics.

An application might expose:

```text
HTTP requests = 1500
HTTP errors = 20
Active users = 100
Request duration = ...
```

Conceptually:

```text
Application
     │
     │ /metrics
     ▼
Prometheus
     │
     ▼
Time-Series Data
     │
     ▼
Visualization
```

The application developer may implement the metrics instrumentation.

The DevOps/SRE team may operate the metrics collection and visualization platform.

### 24.1 Why Client Libraries Matter

Infrastructure metrics may tell us:

```text
CPU = 80%
```

But application metrics can tell us:

```text
HTTP request rate = 5,000/min
HTTP errors = 200/min
Checkout failures = 35/min
Request latency = 450 ms
```

Application-specific metrics provide context that generic infrastructure metrics cannot provide by themselves.

## 25. Practical Lab — Build an Observability Mental Model

This lab is intentionally conceptual.

No cloud resources or production infrastructure are required.

### 25.1 Objective

Understand how metrics, logs and traces work together during an incident.

### 25.2 Scenario

Assume:

```text
User
 │
 ▼
Load Balancer
 │
 ▼
Frontend
 │
 ▼
Backend
 │
 ▼
Database
```

The backend suddenly becomes slow.

### 25.3 Step 1 — Identify Metrics

Create a list:

```text
HTTP request count
HTTP error count
HTTP error rate
Request latency
CPU utilization
Memory utilization
Database latency
Database connection count
```

### 25.4 Step 2 — Identify Logs

Useful events may include:

```text
Request received
Authentication result
Database query started
Database query completed
Database timeout
Application exception
```

### 25.5 Step 3 — Identify Trace Spans

```text
Trace: abc123

├── Load Balancer
├── Frontend
├── Backend
├── Authentication
├── Business Logic
└── Database Query
```

### 25.6 Step 4 — Investigate the Incident

Suppose monitoring reports:

```text
HTTP 500 rate increased
```

Metrics:

```text
Error rate increased at 10:00
```

Logs:

```text
10:00:03 ERROR Database connection timeout
```

Tracing:

```text
Backend → Database
Duration = 4.8 seconds
```

Combined analysis:

```text
Metric
  ↓
Detect problem

Log
  ↓
Identify error

Trace
  ↓
Locate slow dependency
```

### 25.7 Expected Outcome

By completing this exercise, you should be able to explain:

1. What metric detected the problem.
2. What log provided additional context.
3. What trace identified the slow component.
4. How the signals were correlated.
5. Why a single signal was insufficient.

### 25.8 Cleanup

This lab creates no AWS, Kubernetes, cloud or external resources.

Therefore:

```text
Cleanup Required: None
```

If the exercise is documented in a notebook or temporary file, remove those temporary artifacts after completing the exercise.

## 26. Validation Checklist

After completing this section, you should be able to answer **yes** to the following:

* [ ] Can I define observability?
* [ ] Can I explain what a system means?
* [ ] Can I explain why observability is required?
* [ ] Can I explain metrics?
* [ ] Can I explain logs?
* [ ] Can I explain traces?
* [ ] Can I explain the three pillars?
* [ ] Can I explain monitoring?
* [ ] Can I differentiate monitoring and observability?
* [ ] Can I explain why historical metrics matter?
* [ ] Can I explain the `What → Why → How` model?
* [ ] Can I explain SLA?
* [ ] Can I explain SLI?
* [ ] Can I explain SLO?
* [ ] Can I explain an error budget?
* [ ] Can I explain why Kubernetes is more complex to observe?
* [ ] Can I identify common monitoring tools?
* [ ] Can I identify common logging tools?
* [ ] Can I identify common tracing tools?
* [ ] Can I explain ELK?
* [ ] Can I explain EFK?
* [ ] Can I explain OpenTelemetry?
* [ ] Can I explain Prometheus Client Libraries?
* [ ] Can I explain developer responsibilities?
* [ ] Can I explain DevOps/SRE responsibilities?
* [ ] Can I explain how metrics, logs and traces work together?
* [ ] Can I apply the observability troubleshooting mindset?

## 27. Troubleshooting Guide

Although this section is primarily conceptual, the following troubleshooting framework establishes a foundation for diagnosing common observability problems in later practical sections.

### 27.1 Problem — CPU Is High

Do not immediately conclude:

> "CPU is the root cause."

Instead:

```text
CPU Alert
   │
   ▼
Check historical CPU
   │
   ▼
Check request rate
   │
   ▼
Check application behavior
   │
   ▼
Check logs
   │
   ▼
Check traces
   │
   ▼
Identify expensive operation
```

High CPU may be:

* The root cause.
* A symptom of increased traffic.
* The result of inefficient code.
* Normal for a legitimate workload.

### 27.2 Problem — Application Is Slow

Check:

```text
Metrics
 ├── Latency
 ├── CPU
 ├── Memory
 └── Error Rate

Logs
 ├── Exceptions
 ├── Timeouts
 └── Dependency Failures

Traces
 ├── Service Latency
 ├── Database Latency
 └── External API Latency
```

### 27.3 Problem — No Useful Application Metrics

Possible causes:

* Application isn't instrumented.
* Metrics endpoint is missing.
* Metrics library is not configured.
* Prometheus cannot reach the application.
* Authentication or network policy blocks scraping.
* Service discovery is incorrect.

### 27.4 Problem — Logs Exist but Cannot Explain the Incident

Possible causes:

* Poor log messages.
* Missing timestamps.
* Missing request IDs.
* Missing service metadata.
* Unstructured logs.
* Incorrect log level.
* Logs are not centralized.

### 27.5 Problem — Traces Are Incomplete

Possible causes:

* Missing instrumentation.
* Trace context not propagated.
* Unsupported library/framework.
* Sampling configuration.
* Collector/exporter problems.
* Missing instrumentation across services.

## 28. Best Practices

### 28.1 Start With Questions

Do not collect telemetry simply because it is available.

Start with:

```text
What do I need to know?
Why do I need to know it?
How will I act on it?
```

### 28.2 Use Multiple Signals

A mature observability practice should correlate:

```text
Metrics
   +
Logs
   +
Traces
```

### 28.3 Use Historical Data

Current state alone is insufficient for many investigations.

Always consider:

```text
What happened before?
What changed?
What happened during the incident?
What happened afterward?
```

### 28.4 Use Structured Logs

Prefer:

```json
{
  "level": "ERROR",
  "service": "backend",
  "request_id": "abc123",
  "message": "Database timeout"
}
```

over ambiguous free-form messages.

### 28.5 Correlate Telemetry

Useful correlation fields include:

* Trace ID
* Span ID
* Request ID
* Service name
* Namespace
* Pod
* Container
* Environment

### 28.6 Avoid Excessive Cardinality

Be careful with labels such as:

```text
user_id
request_id
session_id
```

These can generate extremely large numbers of unique metric time series.

### 28.7 Do Not Log Secrets

Never intentionally log:

* Passwords
* Access tokens
* Private keys
* Session secrets
* API keys

### 28.8 Create Actionable Alerts

Avoid alerting on every possible metric.

Less useful:

```text
CPU = 70%
```

Potentially more useful:

```text
CPU saturation sustained for 10 minutes
AND
service latency is increasing
```

The exact threshold should be based on workload characteristics and reliability objectives.

## 29. Interview Questions and Answers

### Q1. What is observability?

**Answer:**

Observability is the ability to understand the internal state and behavior of a system by analyzing telemetry produced by that system, such as metrics, logs and traces.

### Q2. What are the three pillars of observability?

**Answer:**

The traditional three pillars are:

1. Metrics
2. Logs
3. Traces

### Q3. What is the difference between monitoring and observability?

**Answer:**

Monitoring primarily focuses on detecting known or expected conditions using metrics, dashboards and alerts. Observability is broader and helps engineers understand system behavior and investigate unknown or unexpected problems using correlated telemetry.

### Q4. Is monitoring part of observability?

**Answer:**

Yes. Monitoring is an important part of a broader observability practice.

### Q5. What do metrics tell us?

**Answer:**

Metrics provide quantitative measurements over time, such as CPU utilization, memory usage, request rate, error rate and latency.

### Q6. Why is historical metric data important?

**Answer:**

Historical data allows engineers to identify trends, anomalies and changes leading up to an incident. Current values alone may not explain what happened before a failure.

### Q7. What are logs?

**Answer:**

Logs are records of events generated by applications, infrastructure and other system components.

### Q8. What is distributed tracing?

**Answer:**

Distributed tracing tracks a request as it travels across multiple services or components and records individual operations as spans within a trace.

### Q9. What is a span?

**Answer:**

A span represents an individual operation within a distributed trace, such as an HTTP request, database query or service call.

### Q10. Give an example of metrics, logs and traces working together.

**Answer:**

Metrics could show that HTTP 500 errors increased. Logs could show database timeout errors. A trace could show that affected requests spent most of their time waiting for the database.

### Q11. What is Prometheus?

**Answer:**

Prometheus is an open-source monitoring and time-series platform commonly used for collecting and querying metrics.

### Q12. What is Grafana?

**Answer:**

Grafana is a visualization and observability platform used to query, visualize and build dashboards from data sources such as Prometheus.

### Q13. What is ELK?

**Answer:**

ELK traditionally refers to:

```text
Elasticsearch
Logstash
Kibana
```

It is commonly used for centralized log processing, search and visualization.

### Q14. What is EFK?

**Answer:**

EFK refers to:

```text
Elasticsearch
Fluent Bit
Kibana
```

Fluent Bit is commonly used as a lightweight log collector and forwarder, especially in containerized environments.

### Q15. Why is Kubernetes observability more complicated?

**Answer:**

Kubernetes is dynamic and distributed. Pods are ephemeral, workloads scale dynamically, requests may cross multiple services, and the environment contains multiple abstraction layers. Therefore, telemetry must be collected and correlated across nodes, pods, containers, services and applications.

### Q16. Who is responsible for observability?

**Answer:**

Observability is a shared responsibility. Developers generally instrument applications, while DevOps/SRE teams commonly build and operate the observability platform. Both teams must collaborate.

### Q17. What is OpenTelemetry?

**Answer:**

OpenTelemetry is a vendor-neutral observability framework and ecosystem providing APIs, SDKs and components for generating, collecting and exporting telemetry such as metrics, logs and traces.

### Q18. Is OpenTelemetry a monitoring tool?

**Answer:**

Not exactly. OpenTelemetry is primarily an instrumentation and telemetry framework/ecosystem. It helps generate, collect and export telemetry to observability backends.

### Q19. What is the difference between SLA and SLO?

**Answer:**

An SLA is generally a formal service agreement with a customer. An SLO is a reliability or performance target used to measure service behavior.

### Q20. What is an SLI?

**Answer:**

An SLI is the actual measurement used to evaluate an SLO.

Example:

```text
Successful requests
--------------------
Total qualifying requests
```

### Q21. What is an error budget?

**Answer:**

An error budget is the amount of unreliability permitted by an SLO over its measurement period.

For a 99.9% availability SLO, the conceptual error budget is 0.1%.

### Q22. Why do modern applications need observability?

**Answer:**

Modern applications are distributed across cloud infrastructure, Kubernetes, microservices, databases and external dependencies. Observability provides the telemetry required to detect, investigate and troubleshoot failures and performance problems.

### Q23. What happens if developers do not instrument an application?

**Answer:**

The observability platform may not have sufficient application-level telemetry. Infrastructure metrics may still be available, but application-specific visibility can be limited.

### Q24. What happens if developers instrument an application but there is no observability platform?

**Answer:**

Telemetry may be generated but not properly collected, stored, queried, visualized or alerted on. Application instrumentation and the observability platform are both required.

### Q25. Does observability replace monitoring?

**Answer:**

No. Monitoring remains an important part of observability. Observability expands the ability to understand and investigate system behavior.

### Q26. What is the relationship between metrics, logs and traces?

**Answer:**

Metrics provide quantitative measurements, logs provide event and error context, and traces show request flow across components. Together, they provide complementary information for incident investigation.

## 30. Summary

Observability is the ability to understand the internal state and behavior of a system through its telemetry.

The traditional model is:

```text
                    OBSERVABILITY
                          │
            ┌─────────────┼─────────────┐
            │             │             │
          Metrics        Logs         Traces
            │             │             │
           WHAT          WHY           HOW
            │             │             │
            └─────────────┼─────────────┘
                          │
                          ▼
                System Understanding
                          │
                          ▼
                   Troubleshooting
                          │
                          ▼
                     Improvement
```

### Monitoring

```text
Metrics
  +
Dashboards
  +
Alerts
```

### Observability

```text
Metrics
   +
Logs
   +
Traces
   +
Correlation
   +
Investigation
```

The most important distinction is:

> Monitoring helps detect and track known conditions; observability helps engineers understand system behavior and investigate problems, including unexpected ones.

## 31. Final Cheat Sheet

### Observability

```text
OBSERVABILITY
│
├── Metrics
│   └── Quantitative measurements
│
├── Logs
│   └── Event records
│
└── Traces
    └── Request flow
```

### Three Pillars

```text
Metrics → What is happening?
Logs    → What happened / what error occurred?
Traces  → How did the request flow?
```

### Monitoring

```text
MONITORING
│
├── Metrics
├── Dashboards
├── Thresholds
└── Alerts
```

### Observability

```text
OBSERVABILITY
│
├── Monitoring
├── Metrics
├── Logs
├── Traces
├── Correlation
└── Investigation
```

### Reliability Concepts

```text
SLI
 ↓
Measurement

SLO
 ↓
Target

SLA
 ↓
Customer/Business Agreement

Error Budget
 ↓
Allowed unreliability
```

### Kubernetes

```text
Cloud
  ↓
Cluster
  ↓
Node
  ↓
Pod
  ↓
Container
  ↓
Application
  ↓
Database
```

### Shared Responsibility

```text
DEVELOPER
   │
   ├── Application Metrics
   ├── Structured Logs
   ├── Trace Instrumentation
   └── Context Propagation
            │
            ▼
      OBSERVABILITY PLATFORM
            │
     ┌──────┼──────┐
     ▼      ▼      ▼
 Metrics   Logs   Traces
     │      │      │
     └──────┼──────┘
            ▼
       Investigation
```

Therefore:

```text
Developer
    +
DevOps/SRE
    =
Effective Observability
```

### Final Mental Model

```text
                         SYSTEM
                           │
                           ▼
                    Telemetry Generated
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
          Metrics         Logs         Traces
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                    Correlate Signals
                           │
                           ▼
                  Understand Behavior
                           │
                           ▼
                    Investigate Issue
                           │
                           ▼
                    Troubleshoot/Fix
                           │
                           ▼
                    Improve System
```

### One-Line Interview Answer

> Monitoring helps us detect and track known conditions; observability gives us the telemetry and context needed to understand system behavior, investigate what happened, identify why it happened, understand how requests flowed through the system, and ultimately troubleshoot the problem.
