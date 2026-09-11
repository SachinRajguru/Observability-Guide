
## Introduction to Observability

> **File:** `README.md`

> **Primary Platform:** Kubernetes / AWS EKS / Cloud-Native Environments
>
> **Focus:** Observability fundamentals, monitoring, metrics, logs, traces, and Kubernetes observability
>
> **Level:** Fundamentals

## Table of Contents

1. [Learning Objectives](#1-learning-objectives)
2. [What Is Observability?](#2-what-is-observability)
   * [2.1 Monitoring](#21-monitoring)
   * [2.2 Logging](#22-logging)
   * [2.3 Tracing](#23-tracing)
3. [Why Do We Need Monitoring?](#3-why-do-we-need-monitoring)
4. [Why Do We Need Observability?](#4-why-do-we-need-observability)
5. [Monitoring vs. Observability](#5-monitoring-vs-observability)
6. [Does Observability Include Monitoring?](#6-does-observability-include-monitoring)
7. [What Can We Monitor?](#7-what-can-we-monitor)
8. [What Can We Observe?](#8-what-can-we-observe)
9. [Monitoring: Bare-Metal Servers vs. Kubernetes](#9-monitoring-bare-metal-servers-vs-kubernetes)
10. [Observability: Bare-Metal Servers vs. Kubernetes](#10-observability-bare-metal-servers-vs-kubernetes)
11. [The Three Primary Observability Signals](#11-the-three-primary-observability-signals)
12. [Observability Tools](#12-observability-tools)
13. [Real-World Example](#13-real-world-example)
14. [Key Takeaways](#14-key-takeaways)

## 1. Learning Objectives

By the end of this section, we should be able to:

* Define observability in the context of modern IT systems.
* Understand the difference between monitoring and observability.
* Understand the roles of metrics, logs, and traces.
* Explain why monitoring is important.
* Explain why observability is important.
* Understand what types of infrastructure and applications can be monitored.
* Compare monitoring on bare-metal servers and Kubernetes.
* Compare observability on traditional infrastructure and Kubernetes.
* Understand why Kubernetes requires a more comprehensive observability approach.
* Identify common monitoring, logging, tracing, and observability tools.
* Explain how metrics, logs, and traces work together during troubleshooting.

> **Important:** This section focuses on the **fundamentals and concepts** of observability. Detailed installation, configuration, queries, dashboards, and implementation of individual tools are covered in later sections of the guide.

## 2. What Is Observability?

**Observability** is the ability to understand the internal state and behavior of a system by analyzing the data it produces.

In modern systems, this data primarily comes from:

* **Metrics**
* **Logs**
* **Traces**

A simple way to understand observability is:

```text
                    System
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Metrics       Logs        Traces
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
                Observability
                       │
                       ▼
              System Understanding
                       │
                       ▼
              Troubleshooting
              & Root Cause Analysis
```

Observability is particularly important in modern cloud-native environments because applications are no longer limited to a single server.

A typical application may contain:

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
API Service
  │
  ├──────────────► Database
  │
  ├──────────────► Authentication Service
  │
  └──────────────► Payment Service
```

A single user request may therefore travel through several services, containers, nodes, databases, and network components.

When something goes wrong, simply knowing that the system is unhealthy may not be enough.

We need to understand:

* What happened?
* When did it happen?
* Where did it happen?
* How did the request flow through the system?
* What component caused the problem?
* What changed before the problem occurred?
* Why did the system behave differently from normal?

Observability helps us answer these questions.

### 2.1 Monitoring

**Monitoring** is the process of continuously collecting and evaluating system information to determine whether the system is operating within expected conditions.

Monitoring commonly focuses on measurable values such as:

* CPU utilization
* Memory utilization
* Disk usage
* Network traffic
* Request rate
* Error rate
* Response latency
* Availability

For example:

```text
CPU Usage
    │
    │                    ┌──────── Alert Threshold
90% ─────────────────────┤
    │              /
    │            /
    │          /
    │        /
    │      /
    └──────────────────────────────► Time
```

If CPU utilization exceeds a predefined threshold, a monitoring system can generate an alert.

### Example

Suppose a server normally operates at:

```text
CPU Usage: 40–60%
```

and suddenly reaches:

```text
CPU Usage: 95%
```

Monitoring can detect the condition and generate an alert such as:

```text
ALERT: CPU utilization is above 90%
```

Monitoring therefore helps us **detect known or expected problem conditions**.

### Useful Mental Model

> **Monitoring helps us identify what is happening and when it requires attention.**

However, the alert alone may not explain why CPU utilization increased.

That is where logs, traces, and other observability data become useful.

### 2.2 Logging

**Logging** is the process of recording events and activities generated by systems, applications, infrastructure, and services.

A log entry may contain information such as:

```text
Timestamp
Application
Log Level
Message
Request ID
User/Session Information
Error Details
```

Example:

```text
2026-09-11 20:15:32
ERROR
payment-service
Database connection timeout
```

Logs provide detailed context about what happened inside a system.

For example, an application may generate:

```text
INFO  User request received
INFO  Authentication successful
INFO  Payment request initiated
ERROR Database connection timeout
ERROR Payment request failed
```

This information can help engineers investigate an incident.

### Useful Mental Model

> Logs provide detailed event context that helps us understand what occurred inside a system.

A common learning analogy is:

> Metrics tell us what is happening, logs provide context about what happened, and traces show how a request moved through the system.

This is a useful mental model rather than a strict rule. In practice, metrics, logs, and traces can all contribute to understanding both symptoms and causes.

## 2.3 Tracing

**Tracing** tracks the journey of a request as it moves through multiple services and components.

Consider a microservices application:

```text
User
 │
 ▼
Frontend
 │
 ▼
API Gateway
 │
 ▼
Order Service
 │
 ├──────► Inventory Service
 │
 └──────► Payment Service
              │
              ▼
           Database
```

A single user request may generate a distributed trace containing multiple operations, commonly called **spans**.

For example:

```text
Request
│
├── Frontend             50 ms
│
├── API Gateway          20 ms
│
├── Order Service        80 ms
│
├── Inventory Service    40 ms
│
└── Payment Service     4.2 sec
      │
      └── Database      4.0 sec
```

The trace immediately gives us an important clue:

```text
Payment Service
      │
      ▼
Database
      │
      ▼
High latency
```

Without tracing, we might only know:

```text
Application response time = 4.5 seconds
```

With tracing, we can identify where the request spent most of its time.

### Useful Mental Model

> Tracing shows how a request flows through distributed components and where time is spent.

## 3. Why Do We Need Monitoring?

Monitoring helps us continuously check the health, performance, availability, and reliability of our systems.

Modern infrastructure can contain:

* Servers
* Virtual machines
* Containers
* Kubernetes clusters
* Databases
* Load balancers
* Networks
* APIs
* Microservices
* Cloud resources

Manually checking each component is not practical.

Monitoring provides continuous visibility into system health.

### 3.1 Detect Problems Early

Monitoring can detect abnormal conditions before they become major incidents.

For example:

```text
CPU increasing
      │
      ▼
Memory increasing
      │
      ▼
Application latency increasing
      │
      ▼
Error rate increasing
      │
      ▼
Service becomes unavailable
```

With appropriate monitoring and alerting, engineers can investigate the problem earlier.

### 3.2 Measure Performance

Monitoring allows us to measure system performance using metrics such as:

* CPU utilization
* Memory utilization
* Request rate
* Response time
* Error rate
* Network latency
* Disk I/O
* Application throughput

These measurements help us understand whether the system is performing within expected limits.

### 3.3 Ensure Availability

Monitoring helps determine whether services are available.

For example:

```text
Application Health
       │
       ├── Healthy
       ├── Degraded
       └── Unavailable
```

Availability monitoring can detect:

* Service downtime
* Failed health checks
* Unreachable endpoints
* Application failures
* Infrastructure failures

### 3.4 Support Capacity Planning

Historical monitoring data can also help organizations understand resource usage trends.

For example:

```text
CPU Usage
100% │                         /
 80% │                    /
 60% │               /
 40% │          /
 20% │     /
  0% └────────────────────────────► Time
```

If resource utilization continuously increases, the team can plan:

* Scaling
* Capacity upgrades
* Resource optimization
* Infrastructure changes

## 4. Why Do We Need Observability?

Monitoring can tell us that something is wrong.

Observability helps us investigate **why the system is behaving that way**.

This becomes particularly important when dealing with complex and distributed systems.

For example:

```text
Monitoring Alert
      │
      ▼
API latency > 2 seconds
      │
      ▼
Why?
      │
      ├── Application issue?
      ├── Database issue?
      ├── Network issue?
      ├── Dependency issue?
      ├── Resource exhaustion?
      └── Recent deployment?
```

Observability provides the information needed to investigate these possibilities.

### 4.1 Diagnose Issues

Observability helps engineers investigate incidents by correlating information from different sources.

For example:

```text
Metric
  │
  ▼
Latency increased
  │
  ▼
Log
  │
  ▼
Database timeout detected
  │
  ▼
Trace
  │
  ▼
Request spent most of its time
waiting for the database
```

This provides a much clearer troubleshooting path.

### 4.2 Understand System Behavior

Modern applications can behave differently depending on:

* Request volume
* Dependencies
* Network conditions
* Resource availability
* Application changes
* Configuration
* User traffic
* Infrastructure changes

Observability helps us understand these behaviors using telemetry data.

### 4.3 Improve Systems

Observability data is not only useful during incidents.

It can also help teams improve:

* Application performance
* Infrastructure utilization
* Reliability
* Capacity planning
* Deployment strategies
* User experience
* System architecture

Observability therefore supports both **incident response** and **continuous improvement**.

## 5. Monitoring vs. Observability

Monitoring and observability are closely related, but they are not identical.

A useful distinction is:

> Monitoring helps us detect and alert on known or expected failure conditions, while observability helps us investigate system behavior and understand why an issue occurred.

| Category        | Monitoring                                           | Observability                                                                     |
| --------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| Primary purpose | Detect and report known conditions                   | Investigate and understand system behavior                                        |
| Focus           | Health, performance, availability                    | Internal behavior and relationships between components                            |
| Typical data    | Primarily metrics and health signals                 | Metrics, logs, traces, and related context                                        |
| Alerts          | Strong focus on predefined thresholds and conditions | Uses telemetry and correlation to support investigation                           |
| Questions       | Is the system healthy? Is something abnormal?        | Why did this happen? Where did it happen? What caused it?                         |
| Example         | CPU usage exceeds 90%                                | Trace shows a request is slow because the database call is taking several seconds |
| Best suited for | Detection and alerting                               | Troubleshooting and root-cause investigation                                      |

### Simple Comparison

```text
Monitoring
    │
    ▼
Something is wrong
    │
    ▼
Alert generated
```

Whereas:

```text
Observability
    │
    ▼
Something is wrong
    │
    ▼
Collect telemetry
    │
    ├── Metrics
    ├── Logs
    └── Traces
    │
    ▼
Correlate information
    │
    ▼
Investigate
    │
    ▼
Understand cause
```

## 6. Does Observability Include Monitoring?

Yes.

Monitoring can be considered an important component of a broader observability strategy.

```text
                 Observability
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
    Metrics          Logs            Traces
       │               │               │
       └───────────────┼───────────────┘
                       │
                       ▼
                 Understanding
                   the System
```

Monitoring traditionally focuses strongly on predefined measurements and alert conditions.

Observability takes a broader approach by combining multiple telemetry signals and contextual information to help engineers investigate system behavior.

Therefore:

> Monitoring helps us know that a problem exists. Observability helps us investigate and understand the problem.

This does not mean monitoring and observability are competing approaches.

They complement each other.

## 7. What Can We Monitor?

Almost every layer of an IT environment can be monitored.

### 7.1 Infrastructure

Infrastructure monitoring may include:

* CPU utilization
* Memory utilization
* Disk utilization
* Disk I/O
* Network traffic
* Network latency
* System load
* Process health

Example:

```text
Server
├── CPU
├── Memory
├── Disk
├── Network
└── Processes
```

### 7.2 Applications

Application monitoring may include:

* Request rate
* Response time
* Error rate
* Throughput
* Application availability
* Application-specific business metrics

For example:

```text
Requests/sec     → 1,500
Average latency  → 120 ms
Error rate       → 0.5%
```

### 7.3 Databases

Database monitoring may include:

* Query performance
* Connection count
* Connection pool utilization
* Transaction rate
* Lock contention
* Storage utilization
* Replication health

### 7.4 Networks

Network monitoring may include:

* Bandwidth
* Latency
* Packet loss
* Connection failures
* Network throughput
* Interface utilization

### 7.5 Security

Security monitoring may include:

* Unauthorized access attempts
* Authentication failures
* Suspicious activity
* Firewall events
* Security events
* Vulnerability information

### 7.6 Kubernetes

In Kubernetes environments, monitoring may include:

* Cluster health
* Node health
* Pod status
* CPU utilization
* Memory utilization
* Container restarts
* Deployment status
* Replica availability
* API server health
* Kubernetes resource usage

For example:

```text
Kubernetes Cluster
│
├── Control Plane
│
├── Nodes
│   ├── Pods
│   ├── Containers
│   └── Resources
│
├── Services
├── Deployments
└── Ingress
```

## 8. What Can We Observe?

Observability focuses on understanding the behavior of the system through telemetry and contextual information.

The three primary signals are:

```text
                 Observability
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Metrics        Logs        Traces
```

### Metrics

Metrics are numerical measurements collected over time.

Examples:

```text
CPU utilization      = 72%
Memory utilization   = 65%
Request rate         = 1,200 req/s
Error rate           = 1.2%
Latency              = 250 ms
```

### Logs

Logs provide detailed records of events.

Example:

```text
ERROR payment-service:
Database connection timeout
```

### Traces

Traces represent the journey of requests through distributed systems.

Example:

```text
User Request
   │
   ▼
API Gateway
   │
   ▼
Order Service
   │
   ▼
Payment Service
   │
   ▼
Database
```

Together, these signals provide a more complete view of system behavior.

## 9. Monitoring: Bare-Metal Servers vs. Kubernetes

Monitoring requirements change significantly when moving from traditional infrastructure to Kubernetes.

### 9.1 Bare-Metal Servers

On a traditional bare-metal server, we generally have direct access to:

* CPU
* Memory
* Disk
* Network interfaces
* Operating system processes
* System logs
* Hardware information

A simplified environment may look like:

```text
Physical Server
│
├── CPU
├── Memory
├── Disk
├── Network
│
└── Operating System
     │
     ├── Application 1
     ├── Application 2
     └── Application 3
```

The environment is comparatively stable.

The server usually has a relatively persistent identity, and applications often run directly on the operating system.

### 9.2 Kubernetes

Kubernetes introduces additional layers and dynamic behavior.

A simplified Kubernetes environment looks like:

```text
Kubernetes Cluster
│
├── Control Plane
│
├── Node
│   ├── Pod
│   │   ├── Container
│   │   └── Container
│   │
│   └── Pod
│
├── Node
│   ├── Pod
│   └── Pod
│
└── Services / Ingress
```

Kubernetes monitoring needs to account for:

* Nodes
* Pods
* Containers
* Deployments
* Services
* Ingress
* Cluster resources
* Container restarts
* Scheduling
* Scaling
* Application health

### Dynamic Environment

Pods are not necessarily permanent.

A pod may:

```text
Created
  │
  ▼
Running
  │
  ▼
Terminated
  │
  ▼
Recreated
```

A new pod may be scheduled onto another node.

Therefore, monitoring must handle changing workloads and infrastructure.

### Scaling

Kubernetes can dynamically scale workloads:

```text
Traffic increases
      │
      ▼
More replicas
      │
      ▼
More pods
      │
      ▼
Potentially more nodes
```

Monitoring must therefore understand the changing state of the cluster.

## 10. Observability: Bare-Metal Servers vs. Kubernetes

Observability becomes more challenging as the number of components and abstraction layers increases.

### 10.1 Bare-Metal Servers

A traditional application may look like:

```text
Server
│
├── Operating System
│
├── Application
│
└── Database
```

There are fewer components and fewer abstraction layers.

Collecting and correlating telemetry is therefore comparatively straightforward.

### 10.2 Kubernetes

A modern Kubernetes application may look like:

```text
User
 │
 ▼
Ingress
 │
 ▼
Service
 │
 ▼
Pod
 │
 ▼
Container
 │
 ▼
Application
 │
 ├──────► Database
 │
 ├──────► Cache
 │
 └──────► External API
```

Now a single request may pass through many distributed components.

The environment may also contain:

* Multiple namespaces
* Multiple deployments
* Multiple replicas
* Multiple nodes
* Multiple services
* Ingress controllers
* Service meshes
* External dependencies
* Cloud-managed services

This creates additional observability challenges.

### 10.3 Why Kubernetes Requires Strong Observability

Kubernetes environments are:

#### Dynamic

Pods can be created, deleted, restarted, and rescheduled.

#### Distributed

Applications can consist of many independent services.

#### Ephemeral

Containers and pods may have short lifetimes.

#### Scalable

The number of replicas can change dynamically.

#### Layered

A problem can exist at the:

```text
Application
     │
Container
     │
Pod
     │
Node
     │
Cluster
     │
Network
     │
Cloud Infrastructure
```

Observability helps engineers correlate information across these layers.

## 11. The Three Primary Observability Signals

The three primary signals commonly used in observability are:

```text
              Telemetry
                  │
      ┌───────────┼───────────┐
      │           │           │
      ▼           ▼           ▼
   Metrics       Logs       Traces
      │           │           │
      ▼           ▼           ▼
 Numerical      Events      Request
 Measurements   & Context   Flow
```

### 11.1 Metrics — "What Is Happening?"

Metrics provide numerical measurements over time.

Example:

```text
CPU = 92%
Memory = 87%
Latency = 2.5 sec
Error Rate = 8%
```

Metrics are particularly useful for:

* Monitoring
* Alerting
* Dashboards
* Capacity planning
* Trend analysis

### 11.2 Logs — "What Happened?"

Logs provide detailed records of system events.

Example:

```text
ERROR:
Unable to connect to database
connection timeout after 30 seconds
```

Logs are useful when we need detailed event context.

### 11.3 Traces — "How Did the Request Flow?"

Traces show how requests move through distributed systems.

Example:

```text
Request
  │
  ├── API Gateway       20 ms
  │
  ├── Order Service     80 ms
  │
  ├── Inventory Service 40 ms
  │
  └── Payment Service  900 ms
```

Traces help identify where latency or failures occur within a distributed request path.

## 12. Observability Tools

There are many tools available for monitoring and observability.

It is useful to classify them based on their primary purpose rather than treating all of them as equivalent.

### 12.1 Metrics and Monitoring

Common tools include:

* Prometheus
* Grafana
* Nagios
* Zabbix
* PRTG

For example:

```text
Application / Infrastructure
          │
          ▼
       Metrics
          │
          ▼
      Prometheus
          │
          ▼
       Grafana
          │
          ▼
      Dashboards
```

Prometheus is commonly used for metrics collection and querying, while Grafana is commonly used for visualization and dashboards.

Detailed Prometheus and Grafana implementation is covered in later sections.

### 12.2 Logging

Common logging technologies and platforms include:

* Elasticsearch
* Logstash
* Kibana
* Fluent Bit
* Splunk

Common combinations include:

### ELK

```text
Elasticsearch
Logstash
Kibana
```

### EFK

```text
Elasticsearch
Fluent Bit
Kibana
```

These technologies can be used to collect, process, store, search, and visualize logs.

### 12.3 Distributed Tracing

Common tracing tools include:

* Jaeger
* Zipkin
* OpenTelemetry

Tracing is particularly valuable in microservices environments where a request can cross multiple services.

Detailed tracing concepts and implementation are covered later in the guide.

### 12.4 Full Observability Platforms

Commercial and managed observability platforms may provide multiple capabilities within a single platform.

Examples include:

* Datadog
* Dynatrace
* New Relic
* Splunk

Depending on the platform, capabilities may include:

* Infrastructure monitoring
* Application monitoring
* Log management
* Distributed tracing
* Dashboards
* Alerting
* Incident investigation
* Security monitoring

## 13. Real-World Example

Consider an e-commerce application running on Kubernetes.

The architecture is:

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
                 API Service
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
       Order       Inventory    Payment
       Service     Service      Service
          │           │           │
          └───────────┼───────────┘
                      │
                      ▼
                   Database
```

Users suddenly report that checkout is slow.

### Step 1 — Monitoring Detects the Problem

Monitoring shows:

```text
API Latency: 4.8 seconds
Error Rate: 3.5%
```

An alert is generated:

```text
ALERT:
Checkout API latency is above the defined threshold.
```

Monitoring has successfully identified the problem.

### Step 2 — Investigate Metrics

The team checks service-level metrics:

```text
Frontend       → Normal
Order Service  → Normal
Inventory      → Normal
Payment        → High latency
Database       → High latency
```

This narrows the investigation.

### Step 3 — Investigate Logs

Logs from the payment service show:

```text
ERROR:
Database connection timeout
```

Now we have additional context.

### Step 4 — Investigate the Trace

The distributed trace shows:

```text
Checkout Request
│
├── Frontend          50 ms
├── API Gateway       20 ms
├── Order Service     80 ms
├── Inventory Service 40 ms
└── Payment Service 4.5 sec
       │
       └── Database 4.3 sec
```

The trace shows that most of the request time was spent waiting for the database.

### Step 5 — Establish the Investigation Path

We now have:

```text
Monitoring
    │
    ▼
Checkout latency increased
    │
    ▼
Metrics
    │
    ▼
Payment service affected
    │
    ▼
Logs
    │
    ▼
Database timeout
    │
    ▼
Trace
    │
    ▼
Database call causing latency
```

This demonstrates why metrics, logs, and traces complement one another.

### Key Lesson

Monitoring helped us **detect the problem**.

Logs provided **event context**.

Tracing helped us understand **where the request spent its time**.

Together, these signals helped us investigate the underlying issue.

## 14. Key Takeaways

### Observability

> Observability is the ability to understand the internal state and behavior of a system by analyzing the telemetry and other data it produces.

### Monitoring

Monitoring helps us:

* Detect problems
* Measure performance
* Monitor availability
* Generate alerts
* Identify abnormal conditions
* Analyze trends

### Logging

Logging provides:

* Detailed event information
* Error context
* Application activity
* Troubleshooting information

### Tracing

Tracing helps us:

* Follow requests across services
* Understand distributed request flow
* Identify latency bottlenecks
* Correlate activity across components

### Monitoring vs. Observability

The simplest distinction is:

```text
Monitoring
    │
    ▼
Detect
    │
    ▼
"Something is wrong."

Observability
    │
    ▼
Investigate
    │
    ▼
"Why is it wrong?"
```

Monitoring and observability are therefore complementary.

### Kubernetes

Kubernetes introduces additional observability challenges because environments are:

* Dynamic
* Distributed
* Ephemeral
* Scalable
* Layered

A Kubernetes observability strategy therefore needs to consider more than just individual servers.

### The Three Primary Signals

```text
                 Observability
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Metrics        Logs        Traces
          │            │            │
          ▼            ▼            ▼
    Measurements     Events    Request Flow
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
              System Understanding
                       │
                       ▼
                Troubleshooting
                & Improvement
```

### Final Mental Model

> Metrics help us identify abnormal behavior. Logs provide detailed context about events. Traces show how requests move through distributed systems. Observability brings these signals together to help us understand and troubleshoot system behavior.
