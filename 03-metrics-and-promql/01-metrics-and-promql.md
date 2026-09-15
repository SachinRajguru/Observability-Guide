
## Prometheus Architecture, PromQL, Metrics, and Grafana

> **File:** `01-metrics-and-promql.md`

## Table of Contents

* [1. Overview](#1-overview)
* [2. Learning Objectives](#2-learning-objectives)
* [3. Prometheus Architecture](#3-prometheus-architecture)
  * [3.1 Prometheus](#31-prometheus)
  * [3.2 Node Exporter](#32-node-exporter)
  * [3.3 kube-state-metrics](#33-kube-state-metrics)
  * [3.4 Custom Application Metrics](#34-custom-application-metrics)
  * [3.5 Other Exporters](#35-other-exporters)
  * [3.6 Prometheus Time Series Database](#36-prometheus-time-series-database)
  * [3.7 PromQL](#37-promql)
  * [3.8 Prometheus HTTP Server](#38-prometheus-http-server)
  * [3.9 Alertmanager](#39-alertmanager)
* [4. Prometheus Data Flow](#4-prometheus-data-flow)
* [5. Practical Environment](#5-practical-environment)
* [6. Accessing Prometheus, Grafana, and Alertmanager](#6-accessing-prometheus-grafana-and-alertmanager)
  * [6.1 Using kubectl Port-Forward](#61-using-kubectl-port-forward)
  * [6.2 AWS EKS with Ingress and ALB](#62-aws-eks-with-ingress-and-alb)
* [7. Inspecting Node Exporter Metrics](#7-inspecting-node-exporter-metrics)
  * [7.1 Verify Node Exporter](#71-verify-node-exporter)
  * [7.2 Verify the Node Exporter Service](#72-verify-the-node-exporter-service)
  * [7.3 Inspect the Metrics Endpoint](#73-inspect-the-metrics-endpoint)
* [8. Inspecting kube-state-metrics](#8-inspecting-kube-state-metrics)
  * [8.1 Verify kube-state-metrics](#81-verify-kube-state-metrics)
  * [8.2 Verify the Service](#82-verify-the-service)
  * [8.3 Inspect the Metrics Endpoint](#83-inspect-the-metrics-endpoint)
* [9. Prometheus and PromQL](#9-prometheus-and-promql)
  * [9.1 Querying a Metric](#91-querying-a-metric)
  * [9.2 Filtering with Labels](#92-filtering-with-labels)
  * [9.3 Querying Pod Restart Metrics](#93-querying-pod-restart-metrics)
* [10. Practical Crashing Pod Exercise](#10-practical-crashing-pod-exercise)
  * [10.1 Create the Test Workload](#101-create-the-test-workload)
  * [10.2 Observe the Pod](#102-observe-the-pod)
  * [10.3 Understand CrashLoopBackOff](#103-understand-crashloopbackoff)
  * [10.4 Query Container Restart Metrics](#104-query-container-restart-metrics)
* [11. Understanding the Complete Metric Flow](#11-understanding-the-complete-metric-flow)
* [12. Exploring Additional Kubernetes Metrics](#12-exploring-additional-kubernetes-metrics)
* [13. Prometheus Metric Discovery and Autocomplete](#13-prometheus-metric-discovery-and-autocomplete)
* [14. Choosing Useful Metrics](#14-choosing-useful-metrics)
* [15. Prometheus vs Grafana](#15-prometheus-vs-grafana)
* [16. Grafana](#16-grafana)
  * [16.1 Grafana Authentication and Authorization](#161-grafana-authentication-and-authorization)
  * [16.2 Grafana Dashboards](#162-grafana-dashboards)
  * [16.3 Grafana Data Sources](#163-grafana-data-sources)
  * [16.4 Creating a Custom Dashboard](#164-creating-a-custom-dashboard)
  * [16.5 Dashboard Time Ranges](#165-dashboard-time-ranges)
  * [16.6 Sharing Dashboards](#166-sharing-dashboards)
* [17. PromQL Aggregation and Functions](#17-promql-aggregation-and-functions)
  * [17.1 sum](#171-sum)
  * [17.2 avg](#172-avg)
  * [17.3 Other Aggregation Operators](#173-other-aggregation-operators)
  * [17.4 rate and increase](#174-rate-and-increase)
* [18. Custom Metrics](#18-custom-metrics)
  * [18.1 Counter](#181-counter)
  * [18.2 Gauge](#182-gauge)
  * [18.3 Histogram](#183-histogram)
  * [18.4 Summary](#184-summary)
  * [18.5 Application Instrumentation](#185-application-instrumentation)
* [19. ServiceMonitor](#19-servicemonitor)
  * [19.1 Why ServiceMonitor Is Useful](#191-why-servicemonitor-is-useful)
  * [19.2 ServiceMonitor and Prometheus Operator](#192-servicemonitor-and-prometheus-operator)
  * [19.3 Manual Scrape Configuration vs ServiceMonitor](#193-manual-scrape-configuration-vs-servicemonitor)
* [20. Best Practices](#20-best-practices)
* [21. Troubleshooting](#21-troubleshooting)
* [22. Cleanup](#22-cleanup)
* [23. Key Takeaways](#23-key-takeaways)
* [24. Interview Questions and Answers](#24-interview-questions-and-answers)

## 1. Overview

**Prometheus** is an open-source monitoring and metrics platform designed to collect, store, query, and evaluate time-series data.

In Kubernetes environments, Prometheus can collect metrics from multiple sources, including:

* Kubernetes nodes
* Kubernetes object state
* Applications
* Databases
* Infrastructure systems
* Other monitoring exporters

Prometheus commonly follows a **pull-based monitoring model**.

Instead of exporters continuously sending metrics to Prometheus, Prometheus periodically connects to configured targets and retrieves their metrics.

A simplified architecture is:

```text
                         Kubernetes Cluster
                                │
             ┌──────────────────┼───────────────────┐
             │                  │                   │
             ▼                  ▼                   ▼
     ┌───────────────┐  ┌────────────────┐  ┌───────────────┐
     │ Node Exporter │  │ kube-state-    │  │ Application   │
     │               │  │ metrics        │  │ Metrics       │
     └───────┬───────┘  └───────┬────────┘  └───────┬───────┘
             │                  │                   │
             │ /metrics         │ /metrics          │ /metrics
             │                  │                   │
             └──────────────────┼───────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │    Prometheus    │
                       │                  │
                       │ Scraping         │
                       │ TSDB             │
                       │ PromQL           │
                       │ Alerting Rules   │
                       └────────┬─────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
             ┌──────────────┐       ┌───────────────┐
             │  Grafana     │       │ Alertmanager  │
             │  Dashboards  │       │ Notifications │
             └──────────────┘       └───────────────┘
```

The core concept is:

```text
      Metric Source
          │
          │ /metrics
          ▼
      Prometheus
          │
          ▼
        TSDB
          │
          ▼
        PromQL
          │
     ┌────┴─────┐
     ▼          ▼
  Grafana    Alerting
                │
                ▼
            Alertmanager
```

## 2. Learning Objectives

By the end of this section, we should understand:

* How Prometheus works.
* The difference between Node Exporter and kube-state-metrics.
* How applications expose custom metrics.
* How Prometheus scrapes and stores metrics.
* What PromQL is and how labels are used.
* How to query Kubernetes metrics.
* How to monitor container restarts.
* How to troubleshoot a crashing workload using Prometheus.
* How Grafana consumes Prometheus metrics.
* How to create useful Grafana dashboards.
* How PromQL aggregation works.
* The common Prometheus metric types.
* How ServiceMonitor works with Prometheus Operator.
* How to select useful metrics for operational monitoring.

## 3. Prometheus Architecture

### 3.1 Prometheus

Prometheus performs several important functions:

1. Discovers or receives configured scrape targets.
2. Scrapes metrics from those targets.
3. Stores metric samples in its time series database.
4. Provides PromQL for querying the stored data.
5. Evaluates alerting rules.
6. Exposes an HTTP interface for queries and administration.

Prometheus can collect metrics from:

```text
Prometheus
   │
   ├── Node Exporter
   ├── kube-state-metrics
   ├── Application Metrics
   ├── MySQL Exporter
   ├── Other Exporters
   └── Other Prometheus-compatible targets
```

Prometheus itself does not need to understand every application or infrastructure system individually. Exporters and instrumented applications expose metrics in a format that Prometheus can scrape.

### 3.2 Node Exporter

**Node Exporter** exposes operating-system and infrastructure-level metrics in a Prometheus-compatible format.

In Kubernetes, Node Exporter is commonly deployed as a **DaemonSet**.

### Why Use a DaemonSet?

Node Exporter collects information from the node on which it runs.

For example:

```text
Node 1 ── Node Exporter
Node 2 ── Node Exporter
Node 3 ── Node Exporter
```

A DaemonSet ensures that a Node Exporter Pod is scheduled on each eligible Kubernetes node.

Typical Node Exporter metrics cover:

* CPU
* Memory
* Disk
* Filesystems
* Network
* Processes
* System activity

For an EC2-backed AWS EKS node, Node Exporter can expose metrics from the operating-system environment running on that node.

#### Metrics Endpoint

Node Exporter commonly exposes metrics through:

```text
/metrics
```

The default Node Exporter HTTP port is commonly:

```text
9100
```

A typical endpoint therefore looks like:

```text
http://<node-exporter-address>:9100/metrics
```

### 3.3 kube-state-metrics

**kube-state-metrics (KSM)** exposes metrics representing the state of Kubernetes objects.

It communicates with the Kubernetes API server and converts Kubernetes object information into Prometheus-compatible metrics.

Examples include information about:

* Pods
* Deployments
* ReplicaSets
* Services
* ConfigMaps
* Secrets
* Jobs
* CronJobs
* Nodes
* Persistent resources
* Other supported Kubernetes objects

For example:

```text
Pod status
Container restarts
Deployment replicas
Available replicas
Job status
Node conditions
```

#### kube-state-metrics Architecture

```text
              Kubernetes API Server
                        │
                        │ API requests
                        ▼
              ┌────────────────────┐
              │ kube-state-metrics │
              └─────────┬──────────┘
                        │
                     /metrics
                        │
                        ▼
                    Prometheus
```

Unlike Node Exporter, kube-state-metrics does not normally require one instance per Kubernetes node.

Its job is to observe Kubernetes object state through the API server.

The commonly used metrics port is:

```text
8080
```

However, the actual Service and port should always be verified in the deployed environment.

### 3.4 Custom Application Metrics

Infrastructure metrics and Kubernetes object-state metrics cannot answer every application-level question.

Applications can expose metrics such as:

```text
HTTP request count
HTTP request duration
Application errors
Active users
User logins
Payment transactions
Database operations
Queue depth
Business events
```

For example:

```text
http_requests_total
user_logins_total
payment_transactions_total
```

An application can expose these metrics through:

```text
/metrics
```

The architecture becomes:

```text
Application
     │
     ▼
Instrumentation
     │
     ▼
Custom Metrics
     │
     │ /metrics
     ▼
Prometheus
```

Application metrics provide visibility that infrastructure metrics cannot provide.

For example:

```text
CPU utilization
    → Infrastructure health

HTTP request rate
    → Application traffic

HTTP request duration
    → Application performance

Payment transaction count
    → Business activity
```

OpenTelemetry can also be used as part of an application's broader observability instrumentation strategy. The exact implementation depends on the programming language, framework, and telemetry architecture.

### 3.5 Other Exporters

Prometheus supports many exporters for systems that do not natively expose Prometheus metrics.

For example:

```text
Prometheus
   │
   ├── Node Exporter
   ├── kube-state-metrics
   ├── MySQL Exporter
   ├── Application Metrics
   └── Other Exporters
```

#### MySQL Exporter

A MySQL exporter can collect database information and expose it as Prometheus metrics.

```text
MySQL
  │
  ▼
MySQL Exporter
  │
  │ /metrics
  ▼
Prometheus
```

The same general pattern applies to other supported systems.

### 3.6 Prometheus Time Series Database

Prometheus stores collected metrics in a **time series database (TSDB)**.

A time series consists of metric samples associated with timestamps and labels.

For example:

```text
Timestamp    CPU Usage
---------    ---------
10:00        40%
10:01        42%
10:02        48%
10:03        55%
10:04        51%
```

The timestamp allows us to understand how a value changes over time.

#### Time Series vs Traditional Data

A traditional database record might represent:

```text
Employee = Sachin
Department = DevOps
```

A time series represents changing values:

```text
10:00 → CPU = 40%
10:01 → CPU = 42%
10:02 → CPU = 48%
```

This makes time-series data particularly useful for monitoring.

A simple analogy is:

```text
Traditional record → Photograph

Time series       → Video
```

A photograph shows a state at one point in time, while a time series helps us understand changes over time.

### 3.7 PromQL

**PromQL (Prometheus Query Language)** is used to select and analyze time-series data stored in Prometheus.

A useful analogy is:

```text
SQL
 │
 └── Relational databases

PromQL
 │
 └── Prometheus
```

PromQL can be used to:

* Select metrics.
* Filter time series.
* Match labels.
* Aggregate data.
* Calculate rates.
* Calculate increases.
* Analyze historical behavior.
* Generate results for dashboards and alerts.

A basic query is:

```promql
kube_pod_container_status_restarts_total
```

A label selector can filter the result:

```promql
kube_pod_container_status_restarts_total{
  namespace="default"
}
```

The expression inside `{}` is a **label selector**.

### 3.8 Prometheus HTTP Server

Prometheus provides an HTTP interface that allows users to interact with the monitoring system.

The Prometheus UI can be used to:

* Execute PromQL queries.
* View table results.
* View graph results.
* Explore metrics.
* Inspect labels.
* Select time ranges.
* Inspect targets and configuration information.

The basic workflow is:

```text
User
 │
 │ PromQL
 ▼
Prometheus HTTP Server
 │
 ▼
Prometheus Query Engine
 │
 ▼
TSDB
 │
 ▼
Query Result
```

### 3.9 Alertmanager

Prometheus can evaluate alerting rules and generate alerts when defined conditions are met.

**Alertmanager** is responsible for handling and routing alerts.

A simplified flow is:

```text
Metric
  │
  ▼
Prometheus
  │
  │ Alert Rule
  ▼
Alert
  │
  ▼
Alertmanager
  │
  ├── Email
  ├── Slack
  └── Other notification systems
```

For example:

```text
Node CPU utilization exceeds threshold
        │
        ▼
Prometheus evaluates alert rule
        │
        ▼
Alert generated
        │
        ▼
Alertmanager
        │
        ▼
Notification
```

Alertmanager can also provide grouping, routing, inhibition, and silencing capabilities.

## 4. Prometheus Data Flow

The complete monitoring flow can be represented as:

```text
                     METRIC SOURCES
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
    Node Exporter  kube-state-metrics  Application
            │              │              │
            │              │              │
            └──────────────┼──────────────┘
                           │
                        /metrics
                           │
                           ▼
                    ┌─────────────┐
                    │ Prometheus  │
                    │ Scraping    │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    TSDB     │
                    └──────┬──────┘
                           │
                         PromQL
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ▼                   ▼
             Prometheus           Grafana
                 │                   │
                 ▼                   ▼
             Alerting            Dashboards
                 │
                 ▼
            Alertmanager
                 │
                 ▼
            Notifications
```

The important sequence is:

1. A metric source exposes metrics.
2. Prometheus discovers or is configured to scrape the target.
3. Prometheus retrieves the metrics endpoint.
4. Prometheus stores the samples in its TSDB.
5. PromQL queries and processes the stored data.
6. Grafana can query Prometheus as a data source.
7. Grafana visualizes the results.
8. Prometheus can evaluate alerting rules.
9. Alertmanager handles alert notification routing.

## 5. Practical Environment

The practical exercises in this section assume that Prometheus has already been installed in a Kubernetes cluster using **kube-prometheus-stack**.

The stack commonly provides:

* Prometheus
* Alertmanager
* Grafana
* Node Exporter
* kube-state-metrics

Verify the monitoring namespace:

```bash
kubectl get pods -n monitoring
```

Verify the Services:

```bash
kubectl get svc -n monitoring
```

The exact generated Service names depend on:

* Helm release name
* Chart version
* Chart configuration
* Enabled components

For example, a Helm release named `monitoring` may generate Services with names similar to:

```text
monitoring-kube-prometheus-prometheus
monitoring-kube-prometheus-alertmanager
monitoring-grafana
```

Do not assume these names in scripts or commands without checking the actual cluster.

Use:

```bash
kubectl get svc -n monitoring
```

to identify the correct Service names.

## 6. Accessing Prometheus, Grafana, and Alertmanager

### 6.1 Using kubectl Port-Forward

`kubectl port-forward` provides a simple way to access internal Kubernetes Services without exposing them externally.

This is particularly useful for:

* Development environments
* Labs
* Temporary access
* Troubleshooting

#### Prometheus

Identify the Prometheus Service:

```bash
kubectl get svc -n monitoring
```

Then use the actual Service name:

```bash
kubectl port-forward -n monitoring svc/<prometheus-service> 9090:9090
```

Open:

```text
http://localhost:9090
```

#### Grafana

```bash
kubectl port-forward -n monitoring svc/<grafana-service> 3000:80
```

Open:

```text
http://localhost:3000
```

The Service port should be verified because chart configuration can change the exposed port.

#### Alertmanager

```bash
kubectl port-forward -n monitoring svc/<alertmanager-service> 9093:9093
```

Open:

```text
http://localhost:9093
```

Always use the actual Service names returned by:

```bash
kubectl get svc -n monitoring
```

### 6.2 AWS EKS with Ingress and ALB

For AWS EKS, Prometheus, Grafana, and Alertmanager can also be exposed through Kubernetes Ingress backed by an Application Load Balancer.

A common architecture is:

```text
Internet
   │
   ▼
AWS ALB
   │
   ▼
Kubernetes Ingress
   │
   ├── Prometheus Service
   ├── Grafana Service
   └── Alertmanager Service
```

The AWS Load Balancer Controller can provision and manage the ALB based on Kubernetes resources.

This approach is useful when persistent or shared access is required.

For temporary lab access, port-forwarding is usually simpler.

## 7. Inspecting Node Exporter Metrics

### 7.1 Verify Node Exporter

Check the workloads:

```bash
kubectl get pods -n monitoring
```

Check the DaemonSets:

```bash
kubectl get daemonset -n monitoring
```

Check Pod placement:

```bash
kubectl get pods -n monitoring -o wide
```

A Node Exporter DaemonSet normally results in a Node Exporter Pod on each eligible Kubernetes node.

### 7.2 Verify the Node Exporter Service

List the Services:

```bash
kubectl get svc -n monitoring
```

Identify the Node Exporter Service.

If the Service is a `ClusterIP`, it is intended for internal cluster access rather than direct public exposure.

This is generally preferable for metrics endpoints that do not need to be publicly accessible.

### 7.3 Inspect the Metrics Endpoint

From an environment that can reach the Service:

```bash
curl http://<node-exporter-address>:9100/metrics
```

The response contains Prometheus-formatted metrics.

Typical categories include:

```text
CPU
Memory
Disk
Filesystem
Network
Processes
System activity
```

The important relationship is:

```text
Node Exporter
      │
      │ /metrics
      ▼
Prometheus
```

Node Exporter normally does not push metrics directly into Prometheus.

Prometheus periodically scrapes the endpoint.

#### Minikube Environment

For Minikube, we can access the node using:

```bash
minikube ssh
```

From there, the appropriate Node Exporter endpoint or Service can be inspected based on the deployed configuration.

## 8. Inspecting kube-state-metrics

### 8.1 Verify kube-state-metrics

Check the Pods:

```bash
kubectl get pods -n monitoring
```

kube-state-metrics does not normally require one Pod per Kubernetes node.

Its architecture is:

```text
Kubernetes Nodes
       │
       │
       ▼
Kubernetes API Server
       │
       ▼
kube-state-metrics
       │
       ▼
/metrics
```

### 8.2 Verify the Service

List the Services:

```bash
kubectl get svc -n monitoring
```

Identify the kube-state-metrics Service.

The commonly used metrics port is:

```text
8080
```

However, verify the actual port in the deployed environment.

### 8.3 Inspect the Metrics Endpoint

From an environment that can reach the Service:

```bash
curl http://<kube-state-metrics-address>:8080/metrics
```

To inspect restart-related metrics:

```bash
curl http://<kube-state-metrics-address>:8080/metrics | grep restart
```

To inspect container-related metrics:

```bash
curl http://<kube-state-metrics-address>:8080/metrics | grep container
```

This demonstrates that kube-state-metrics exposes Kubernetes object-state information in Prometheus-compatible format.

## 9. Prometheus and PromQL

### 9.1 Querying a Metric

One useful kube-state-metrics metric is:

```promql
kube_pod_container_status_restarts_total
```

This metric represents the cumulative number of restarts for containers.

A basic query is:

```promql
kube_pod_container_status_restarts_total
```

The result may contain multiple time series because different Pods, containers, namespaces, and other labels identify different series.

### 9.2 Filtering with Labels

PromQL allows us to select specific time series using labels.

For example:

```promql
kube_pod_container_status_restarts_total{
  namespace="default"
}
```

The general syntax is:

```promql
metric_name{label="value"}
```

Multiple labels can also be used:

```promql
kube_pod_container_status_restarts_total{
  namespace="default",
  pod="busybox-crash"
}
```

Labels allow us to move from a broad metric to a specific workload.

### 9.3 Querying Pod Restart Metrics

To view all container restart series:

```promql
kube_pod_container_status_restarts_total
```

To view only the `default` namespace:

```promql
kube_pod_container_status_restarts_total{
  namespace="default"
}
```

To view one Pod:

```promql
kube_pod_container_status_restarts_total{
  namespace="default",
  pod="busybox-crash"
}
```

To view one container:

```promql
kube_pod_container_status_restarts_total{
  namespace="default",
  pod="busybox-crash",
  container="busybox"
}
```

The exact available labels should always be verified in the Prometheus UI because labels can vary depending on the metric and exporter version.

#### Table and Graph Views

The Prometheus UI can display results in:

* Table view
* Graph view

The table is useful for inspecting individual time series.

The graph is useful for understanding changes over time.

For a cumulative restart counter:

```text
Restart Count
     │
  4  │             ●
  3  │       ●
  2  │   ●
  1  │ ●
  0  └────────────────────
       Time →
```

## 10. Practical Crashing Pod Exercise

A controlled crashing workload provides a useful way to validate the complete monitoring pipeline.

### 10.1 Create the Test Workload

Create a file named:

```text
busybox-crash.yaml
```

Add:

```yaml
apiVersion: v1
kind: Pod

metadata:
  name: busybox-crash
  namespace: default

spec:
  restartPolicy: Always

  containers:
    - name: busybox
      image: busybox:1.36

      command:
        - /bin/sh
        - -c

      args:
        - |
          echo "Intentional test failure"
          exit 1
```

Apply the manifest:

```bash
kubectl apply -f busybox-crash.yaml
```

The important difference here is:

```yaml
restartPolicy: Always
```

This allows Kubernetes to repeatedly restart the failed container.

### 10.2 Observe the Pod

Check the Pod:

```bash
kubectl get pod busybox-crash
```

Watch the Pod:

```bash
kubectl get pod busybox-crash -w
```

The Pod may eventually show:

```text
CrashLoopBackOff
```

Inspect the Pod:

```bash
kubectl describe pod busybox-crash
```

View the logs:

```bash
kubectl logs busybox-crash
```

The container intentionally terminates with:

```bash
exit 1
```

### 10.3 Understand CrashLoopBackOff

The container repeatedly starts and exits.

Kubernetes attempts to restart it and applies an increasing backoff delay between repeated failures.

Conceptually:

```text
Container starts
       │
       ▼
Application exits
       │
       ▼
Kubernetes restarts container
       │
       ▼
Application exits again
       │
       ▼
Restart attempts continue
       │
       ▼
Increasing restart backoff
       │
       ▼
CrashLoopBackOff
```

`CrashLoopBackOff` does not mean the Pod has permanently stopped.

It indicates that Kubernetes is repeatedly attempting to restart a failing container while applying backoff between attempts.

### 10.4 Query Container Restart Metrics

Open the Prometheus UI and execute:

```promql
kube_pod_container_status_restarts_total{
  namespace="default",
  pod="busybox-crash"
}
```

Switch to the graph view.

As the container restarts, the cumulative restart count should increase.

We can also query all restart metrics:

```promql
kube_pod_container_status_restarts_total
```

Or filter by namespace:

```promql
kube_pod_container_status_restarts_total{
  namespace="default"
}
```

This exercise demonstrates how a Kubernetes failure becomes observable through kube-state-metrics and Prometheus.

## 11. Understanding the Complete Metric Flow

The crashing Pod exercise demonstrates the complete monitoring path.

### Step 1 — Create the Workload

```bash
kubectl apply -f busybox-crash.yaml
```

The request is sent to the Kubernetes API server.

### Step 2 — Kubernetes Runs the Container

Kubernetes schedules and starts the container.

The container intentionally exits:

```bash
exit 1
```

### Step 3 — Kubernetes Updates Pod State

Kubernetes maintains the Pod and container state.

The restart count changes as the container is restarted.

### Step 4 — kube-state-metrics Observes Kubernetes State

kube-state-metrics communicates with the Kubernetes API server and exposes Kubernetes object-state metrics.

One relevant metric is:

```text
kube_pod_container_status_restarts_total
```

### Step 5 — kube-state-metrics Exposes Metrics

The metric is available through the kube-state-metrics `/metrics` endpoint.

### Step 6 — Prometheus Scrapes kube-state-metrics

Prometheus periodically retrieves:

```text
/metrics
```

### Step 7 — Prometheus Stores Samples

Prometheus stores the metric samples in its TSDB.

### Step 8 — PromQL Queries the Data

We execute:

```promql
kube_pod_container_status_restarts_total{
  namespace="default",
  pod="busybox-crash"
}
```

### Step 9 — Results Are Visualized

The result can be viewed directly in Prometheus or visualized through Grafana.

### Complete Flow

```text
kubectl
   │
   ▼
Kubernetes API Server
   │
   ▼
Pod / Container State
   │
   ▼
kube-state-metrics
   │
   │ /metrics
   ▼
Prometheus
   │
   ▼
TSDB
   │
   │ PromQL
   ▼
Prometheus UI
   │
   └──────────────► Grafana
```

This flow is one of the most important concepts when troubleshooting Kubernetes monitoring.

## 12. Exploring Additional Kubernetes Metrics

kube-state-metrics exposes many Kubernetes-related metrics.

For example, init container restart information can be queried using:

```promql
kube_pod_init_container_status_restarts_total
```

If no init containers currently match the query, Prometheus may return no data.

This does not necessarily indicate a monitoring failure.

It may simply mean that no matching time series currently exist.

Kubernetes contains many objects:

```text
Cluster
 ├── Nodes
 ├── Namespaces
 ├── Pods
 ├── Containers
 ├── Deployments
 ├── ReplicaSets
 ├── Services
 ├── ConfigMaps
 ├── Secrets
 ├── Jobs
 └── Other resources
```

The goal is not to memorize every kube-state-metrics metric.

Instead, we should understand how to:

1. Identify the information required.
2. Discover the appropriate metric.
3. Inspect its labels.
4. Filter the metric.
5. Aggregate the results.
6. Visualize or alert on the result when required.

## 13. Prometheus Metric Discovery and Autocomplete

The Prometheus UI provides metric autocomplete.

Start entering a metric prefix such as:

```text
kube_
```

The UI can display available metrics matching the prefix.

Examples may include:

```text
kube_pod_...
kube_deployment_...
kube_configmap_...
kube_secret_...
kube_node_...
```

This is useful because a production Kubernetes environment can expose a large number of metrics.

### Example: Discovering ConfigMap Metrics

Search for:

```text
kube_configmap
```

Review the available metrics and inspect their labels.

The exact metric names depend on the installed kube-state-metrics version and configuration.

A useful workflow is:

```text
Requirement
    │
    ▼
Identify required information
    │
    ▼
Search Prometheus autocomplete
    │
    ▼
Inspect metric and labels
    │
    ▼
Write PromQL
    │
    ▼
Validate the result
    │
    ▼
Create dashboard or alert
```

Metric discovery is therefore a practical monitoring skill.

## 14. Choosing Useful Metrics

There is no universal list of metrics that every organization must monitor.

Metric selection depends on:

* Application architecture
* Infrastructure
* Business requirements
* Reliability requirements
* Operational requirements
* SLOs and SLIs
* Incident history
* Capacity requirements

### Infrastructure Metrics

```text
CPU utilization
Memory utilization
Disk utilization
Filesystem usage
Network activity
```

### Kubernetes Metrics

```text
Pod status
Container restarts
Deployment replicas
Available replicas
Node status
Persistent resource status
```

### Application Metrics

```text
HTTP request rate
HTTP request duration
Error rate
Active users
Login count
Transaction count
```

The goal is not to collect everything.

The goal is to collect the metrics that help answer meaningful operational questions.

For example:

```text
Question:
Why is the application slow?

Possible metrics:
- Request rate
- Request duration
- Error rate
- CPU
- Memory
- Database latency
```

## 15. Prometheus vs Grafana

Prometheus and Grafana are complementary technologies.

| Capability            | Prometheus                                              | Grafana                         |
| --------------------- | ------------------------------------------------------- | ------------------------------- |
| Metric collection     | Yes                                                     | No                              |
| Metric storage        | Yes                                                     | No                              |
| PromQL                | Yes                                                     | Queries Prometheus using PromQL |
| Basic graphing        | Yes                                                     | Yes                             |
| Advanced dashboards   | Limited                                                 | Strong                          |
| Multiple data sources | Primarily Prometheus ecosystem                          | Yes                             |
| Alert evaluation      | Yes                                                     | Also supports alerting features |
| Primary role          | Metrics collection, storage, querying, alert evaluation | Visualization and dashboarding  |

### Prometheus

Prometheus focuses on:

```text
Scrape
  ↓
Store
  ↓
Query
  ↓
Evaluate
```

### Grafana

Grafana focuses on:

```text
Query data sources
       ↓
Visualize
       ↓
Build dashboards
       ↓
Share information
```

A useful analogy is:

```text
Prometheus
→ Measurement and monitoring data system

Grafana
→ Visualization and presentation layer
```

A DevOps or SRE engineer may use Prometheus directly during troubleshooting, while a broader audience can consume the same information through Grafana dashboards.

## 16. Grafana

Grafana is a visualization and dashboard platform that can connect to multiple data sources.

In a kube-prometheus-stack deployment, Grafana is commonly deployed alongside Prometheus.

The relationship is:

```text
Prometheus
    │
    │ Metrics
    ▼
Grafana
    │
    ▼
Dashboards
```

### 16.1 Grafana Authentication and Authorization

Grafana provides authentication and access-management capabilities.

Depending on the deployment and configuration, Grafana can integrate with:

* Local users
* Identity providers
* SSO
* Teams
* Roles
* Organizations

Access can be designed according to organizational requirements.

For example:

```text
Management
    │
    └── View dashboards

DevOps / SRE
    │
    ├── Create dashboards
    ├── Update dashboards
    └── Manage dashboards

Development
    │
    └── View application dashboards

QA
    │
    └── View testing dashboards
```

The exact capabilities and access model depend on the Grafana edition and configuration.

The important principle is **least privilege**.

### 16.2 Grafana Dashboards

Grafana dashboards can present information such as:

* Node utilization
* Pod utilization
* Namespace information
* Persistent volume information
* CPU usage
* Memory usage
* Network activity
* Application metrics
* Error rates
* Latency

Dashboards reduce the need to repeatedly execute individual PromQL queries.

For example:

```text
Kubernetes Dashboard
 ├── CPU
 ├── Memory
 ├── Pod Restarts
 ├── Network
 ├── Namespace
 └── Service Health
```

### 16.3 Grafana Data Sources

Grafana supports multiple data sources.

Examples include:

* Prometheus
* InfluxDB
* Graphite
* Other supported data systems

Conceptually:

```text
                    Grafana
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
      Prometheus   InfluxDB      Graphite
```

#### Verify the Prometheus Service

In Kubernetes:

```bash
kubectl get svc -n monitoring
```

The Prometheus Service DNS name can then be used when configuring Grafana, depending on the deployment architecture.

### 16.4 Creating a Custom Dashboard

Suppose a team wants a dashboard showing container restarts.

A suitable PromQL query is:

```promql
kube_pod_container_status_restarts_total{
  namespace="default"
}
```

A typical Grafana workflow is:

```text
Create
  ↓
Dashboard
  ↓
Add visualization
  ↓
Select Prometheus
  ↓
Enter PromQL
  ↓
Run query
  ↓
Choose visualization
  ↓
Configure panel
  ↓
Save dashboard
```

The result can be displayed as a graph, table, stat panel, or another suitable visualization.

### 16.5 Dashboard Time Ranges

Grafana allows users to select different time ranges.

Examples include:

```text
Last 5 minutes
Last 30 minutes
Last 1 hour
Last 6 hours
Last 24 hours
Last 7 days
```

Time ranges are particularly useful during incident investigation.

For example:

```text
Last 5 minutes
→ Detailed view of a recent issue

Last 24 hours
→ Identify whether the issue has occurred repeatedly

Last 7 days
→ Identify longer-term patterns
```

### 16.6 Sharing Dashboards

Grafana can provide monitoring information to teams without requiring direct Kubernetes access.

For example:

```text
Management Dashboard
 ├── Application Health
 ├── Error Rate
 ├── Request Rate
 ├── Response Time
 ├── Pod Restarts
 └── Resource Utilization
```

Management users can consume the dashboard without directly executing:

```bash
kubectl
```

or writing PromQL queries.

The dashboard should focus on information relevant to the intended audience.

## 17. PromQL Aggregation and Functions

PromQL provides aggregation operators and functions that allow detailed time series to be transformed into useful summaries.

Suppose we have:

```text
Pod A → 10
Pod B → 20
Pod C → 30
Pod D → 40
```

We may want:

```text
Total → 100
Average → 25
```

### 17.1 `sum`

The `sum` aggregator adds values.

For example:

```promql
sum(
  kube_pod_container_status_restarts_total
)
```

We can group the result by namespace:

```promql
sum by (namespace) (
  kube_pod_container_status_restarts_total
)
```

This produces an aggregated result for each namespace.

### 17.2 `avg`

The `avg` aggregator calculates an average.

For example:

```promql
avg(
  kube_pod_container_status_restarts_total
)
```

Grouping is also possible:

```promql
avg by (namespace) (
  kube_pod_container_status_restarts_total
)
```

Aggregation is particularly useful when a dashboard needs a higher-level summary instead of displaying every individual time series.

### 17.3 Other Aggregation Operators

Common PromQL aggregation operators include:

```text
sum
avg
min
max
count
```

For example:

```promql
count(
  kube_pod_container_status_restarts_total
)
```

This can help determine how many matching time series exist.

Aggregation should always be selected according to the question we are trying to answer.

### 17.4 `rate` and `increase`

Many Prometheus metrics are **counters**.

A counter generally increases over time and may reset when the application or process restarts.

For example:

```text
http_requests_total
```

A common way to calculate the per-second increase of a counter is:

```promql
rate(http_requests_total[5m])
```

This calculates the average per-second rate of increase over the selected five-minute range.

To calculate the total increase over a period:

```promql
increase(http_requests_total[1h])
```

This is useful for questions such as:

```text
How many requests occurred during the last hour?
```

#### Resource Utilization Example

For CPU utilization, raw cumulative CPU counters should generally be converted into a rate before interpreting them as usage.

For example:

```promql
sum by (instance) (
  rate(node_cpu_seconds_total{
    mode!="idle"
  }[5m])
)
```

The exact calculation should be adapted to the desired CPU utilization definition and dashboard requirements.

The important concept is:

```text
Counter
   │
   ▼
rate() / increase()
   │
   ▼
Meaningful time-based result
```

## 18. Custom Metrics

Infrastructure and Kubernetes-state metrics do not answer every monitoring question.

For example:

> How many users logged in during the last 15 minutes?

Node Exporter cannot answer this.

kube-state-metrics cannot answer this.

The application needs to expose a suitable metric.

Examples include:

```text
http_requests_total
user_logins_total
payment_transactions_total
application_errors_total
```

Custom metrics provide application and business-level visibility.

### 18.1 Counter

A **Counter** represents a value that generally increases over time.

Examples:

```text
HTTP requests
Errors
Logins
Transactions
```

Example:

```text
user_logins_total
```

Counters are commonly analyzed with:

```promql
rate()
increase()
```

### 18.2 Gauge

A **Gauge** represents a value that can increase or decrease.

Examples:

```text
Current memory usage
Current temperature
Active users
Queue size
```

For example:

```text
active_users
```

Unlike a counter, a gauge can move in both directions.

### 18.3 Histogram

A **Histogram** samples observations and counts them in configurable buckets.

Histograms are useful for measuring distributions such as:

```text
HTTP request duration
Response latency
Response size
```

For example, an application may record request durations into buckets:

```text
≤ 100 ms
≤ 250 ms
≤ 500 ms
≤ 1 s
≤ 2 s
```

This allows the distribution of observations to be analyzed.

### 18.4 Summary

A **Summary** tracks observations and can calculate configured quantiles on the client side.

Summaries can be used for measurements such as:

```text
Request latency
Response duration
```

The choice between Histogram and Summary depends on the monitoring requirements and the analysis that needs to be performed.

### 18.5 Application Instrumentation

Applications can be instrumented to expose custom metrics.

A simplified architecture is:

```text
Application Code
      │
      ▼
Instrumentation
      │
      ▼
Custom Metrics
      │
      │ /metrics
      ▼
Prometheus
```

The implementation depends on:

* Programming language
* Application framework
* Metrics library
* Deployment architecture
* Observability requirements

OpenTelemetry can also be used as part of an application observability strategy.

## 19. ServiceMonitor

Kubernetes environments can contain hundreds or thousands of workloads.

Manually maintaining Prometheus scrape targets for every application can become difficult.

**ServiceMonitor** provides a Kubernetes-native declarative mechanism for defining scrape targets in Prometheus Operator environments.

A simplified architecture is:

```text
Kubernetes Services
        │
        ├── login-service
        ├── payment-service
        ├── order-service
        └── catalog-service
```

Suppose only two applications expose metrics:

```text
login-service
    │
    └── /metrics

payment-service
    │
    └── /metrics
```

A ServiceMonitor can select the intended Services.

```text
              ServiceMonitor
                    │
           ┌────────┴────────┐
           ▼                 ▼
      login-service   payment-service
           │                 │
        /metrics          /metrics
           │                 │
           └────────┬────────┘
                    ▼
                Prometheus
```

### 19.1 Why ServiceMonitor Is Useful

Without appropriate target selection, Prometheus could maintain a large number of unnecessary scrape targets.

A better design is:

```text
Kubernetes Services
       │
       ▼
Service selection
       │
       ▼
Relevant metrics endpoints
       │
       ▼
Prometheus
```

This makes scrape configuration easier to manage and helps control monitoring overhead.

### 19.2 ServiceMonitor and Prometheus Operator

ServiceMonitor is a **custom resource** associated with the Prometheus Operator ecosystem.

The kube-prometheus-stack uses Prometheus Operator components, making ServiceMonitor a natural approach for declarative application scraping.

Inspect existing ServiceMonitors:

```bash
kubectl get servicemonitor -A
```

Inspect a specific ServiceMonitor:

```bash
kubectl describe servicemonitor <servicemonitor-name> -n <namespace>
```

Inspect Services:

```bash
kubectl get svc -n <namespace>
```

Display Service labels:

```bash
kubectl get svc <service-name> -n <namespace> --show-labels
```

The ServiceMonitor selector and the Service labels must be configured consistently.

The exact target-selection behavior can also depend on the Prometheus resource configuration and Helm chart values.

### 19.3 Manual Scrape Configuration vs ServiceMonitor

Traditional Prometheus configurations can define scrape targets manually.

For example:

```yaml
scrape_configs:
  - job_name: application
    static_configs:
      - targets:
          - application:8080
```

This approach is still valid when Prometheus is managed through its native configuration.

In Prometheus Operator environments, ServiceMonitor provides a Kubernetes-native declarative approach:

```text
Kubernetes Service
       │
       ▼
ServiceMonitor
       │
       ▼
Prometheus Operator
       │
       ▼
Prometheus Configuration
       │
       ▼
/metrics
```

Neither approach is universally better.

The appropriate approach depends on how Prometheus is deployed and managed.

## 20. Best Practices

### 20.1 Select Metrics Based on Requirements

Do not monitor every metric simply because it exists.

Start with:

```text
What needs to be monitored?
        ↓
Which metric represents it?
        ↓
Which labels are required?
        ↓
What aggregation is useful?
        ↓
Does it need a dashboard?
        ↓
Does it need an alert?
```

### 20.2 Use Labels Carefully

Labels are powerful because they allow time series to be differentiated.

Useful labels may include:

```text
namespace
pod
container
service
environment
```

Avoid unnecessary high-cardinality labels such as unique:

```text
request IDs
user IDs
session IDs
random identifiers
```

unless the monitoring architecture has been deliberately designed to handle that cardinality.

High-cardinality metrics can significantly increase Prometheus resource consumption.

### 20.3 Prefer Declarative Configuration

For Prometheus Operator environments, Kubernetes-native resources such as ServiceMonitor can make monitoring configuration:

* Declarative
* Version-controlled
* Reviewable
* Easier to manage

### 20.4 Protect Metrics Endpoints

Metrics endpoints can expose sensitive infrastructure and application information.

Avoid unnecessarily exposing:

```text
/metrics
```

directly to the public internet.

Prefer controlled access:

```text
Internal Service
      │
      ▼
Prometheus
```

If external access is required, use appropriate authentication, authorization, network controls, and TLS according to the environment.

### 20.5 Use Grafana for Presentation

Prometheus is well suited for:

```text
Collect
Store
Query
Evaluate
```

Grafana is well suited for:

```text
Visualize
Dashboard
Filter
Share
```

Keeping these responsibilities conceptually separate makes monitoring architectures easier to understand and maintain.

### 20.6 Pin Versions for Reproducible Labs

Record or pin relevant:

* Container image versions
* Helm chart versions
* Kubernetes versions
* Configuration versions

Avoid relying on:

```text
latest
```

for reproducible labs or production deployments.

### 20.7 Build Dashboards Around Operational Questions

A dashboard should answer a question rather than simply display every available metric.

For example:

```text
Question:
Is the application healthy?

Dashboard:
├── Request rate
├── Error rate
├── Latency
├── Pod availability
└── Container restarts
```

This is generally more useful than a dashboard containing dozens of unrelated graphs.

## 21. Troubleshooting

### Problem 1: Prometheus Query Returns No Data

Start by checking whether the metric exists:

```promql
kube_pod_container_status_restarts_total
```

Check the monitoring components:

```bash
kubectl get pods -n monitoring
```

Check kube-state-metrics:

```bash
kubectl get pods -n monitoring | grep kube-state-metrics
```

Check Services:

```bash
kubectl get svc -n monitoring
```

Then verify the Prometheus target configuration and target health in the Prometheus UI.

### Problem 2: Namespace Filter Returns No Data

For:

```promql
kube_pod_container_status_restarts_total{
  namespace="default"
}
```

verify that matching workloads exist:

```bash
kubectl get pods -n default
```

If no matching Pods or time series exist, Prometheus may correctly return no data.

### Problem 3: Node Exporter Is Missing

Check the DaemonSet:

```bash
kubectl get daemonset -n monitoring
```

Check the Pods:

```bash
kubectl get pods -n monitoring -o wide
```

Describe a Node Exporter Pod:

```bash
kubectl describe pod <node-exporter-pod> -n monitoring
```

Check logs:

```bash
kubectl logs <node-exporter-pod> -n monitoring
```

### Problem 4: kube-state-metrics Is Missing

Check:

```bash
kubectl get pods -n monitoring
```

Describe the Pod:

```bash
kubectl describe pod <kube-state-metrics-pod> -n monitoring
```

Check logs:

```bash
kubectl logs <kube-state-metrics-pod> -n monitoring
```

### Problem 5: Grafana Shows No Data

First verify the Prometheus query directly in Prometheus:

```promql
kube_pod_container_status_restarts_total
```

If the query works in Prometheus but not in Grafana, investigate:

* Grafana data source configuration
* Prometheus URL
* Authentication
* Network connectivity
* Dashboard query
* Dashboard variables
* Selected time range

Verify the Services:

```bash
kubectl get svc -n monitoring
```

### Problem 6: Port-Forward Fails

Verify the Service:

```bash
kubectl get svc -n monitoring
```

Verify the Pods:

```bash
kubectl get pods -n monitoring
```

Then use the actual Service name:

```bash
kubectl port-forward -n monitoring svc/<actual-service-name> 9090:9090
```

If the Service port differs, use the correct Service port exposed by the deployment.

### Problem 7: ServiceMonitor Does Not Create a Scrape Target

Verify that the ServiceMonitor exists:

```bash
kubectl get servicemonitor -A
```

Inspect it:

```bash
kubectl describe servicemonitor <servicemonitor-name> -n <namespace>
```

Check the target Service:

```bash
kubectl get svc <service-name> -n <namespace> --show-labels
```

Verify:

* Service labels
* ServiceMonitor selectors
* Metrics endpoint path
* Metrics port name
* Namespace selection
* Prometheus resource selection
* Prometheus Operator configuration

## 22. Cleanup

The monitoring stack should not be removed if it is being used by other labs or workloads.

Only remove resources created specifically for this exercise.

### Remove the Test Pod

```bash
kubectl delete pod busybox-crash -n default
```

Verify:

```bash
kubectl get pod busybox-crash -n default
```

If the local manifest was created only for this exercise, remove it as well.

Linux:

```bash
rm busybox-crash.yaml
```

Windows PowerShell:

```powershell
Remove-Item busybox-crash.yaml
```

### Stop Port-Forward Sessions

Stop running port-forward processes with:

```text
Ctrl+C
```

This terminates the local forwarding session without deleting Kubernetes resources.

### Remove Temporary Ingress Resources

If an Ingress or ALB configuration was created specifically for the exercise, remove it using the corresponding manifest:

```bash
kubectl delete -f <ingress-file>.yaml
```

Only remove resources created specifically for the lab.

## 23. Key Takeaways

The most important concepts are:

1. **Prometheus is a monitoring and metrics platform.**
2. **Prometheus commonly uses a pull-based scraping model.**
3. **Node Exporter exposes node and operating-system metrics.**
4. **Node Exporter commonly runs as a DaemonSet in Kubernetes.**
5. **kube-state-metrics exposes Kubernetes object-state metrics.**
6. **kube-state-metrics communicates with the Kubernetes API server.**
7. **Applications can expose custom application and business metrics.**
8. **Exporters and applications commonly expose metrics through `/metrics`.**
9. **Prometheus stores metric samples in a time series database.**
10. **PromQL is used to query and analyze Prometheus data.**
11. **Labels allow specific time series to be selected and filtered.**
12. **Alertmanager handles alert routing and notification management.**
13. **Grafana provides visualization and dashboard capabilities.**
14. **Grafana can use Prometheus and other supported data sources.**
15. **PromQL aggregation converts detailed time series into useful summaries.**
16. **Counters, Gauges, Histograms, and Summaries represent different types of measurements.**
17. **Custom metrics provide application-specific visibility.**
18. **ServiceMonitor provides declarative scrape configuration in Prometheus Operator environments.**
19. **Metric selection should be driven by operational and business requirements.**
20. **High-cardinality labels should be used carefully.**
21. **Metrics endpoints should be protected from unnecessary public exposure.**
22. **Dashboards should be designed around meaningful operational questions.**

The core architecture to remember is:

```text
Exporter / Application
          │
          │ /metrics
          ▼
      Prometheus
          │
          ▼
         TSDB
          │
        PromQL
          │
     ┌────┴────┐
     ▼         ▼
  Grafana   Alerting
     │         │
     ▼         ▼
Dashboards Alertmanager
               │
               ▼
          Notifications
```

The most important practical troubleshooting flow is:

```text
Metric Source
     │
     ▼
/metrics Endpoint
     │
     ▼
Prometheus Target
     │
     ▼
TSDB
     │
     ▼
PromQL
     │
     ▼
Grafana / Alerting
```

## 24. Interview Questions and Answers

### Q1. What is Prometheus?

**Answer:**

Prometheus is a monitoring and metrics platform that collects time-series metrics, stores them in its TSDB, provides PromQL for querying the data, and supports alert evaluation and integration with Alertmanager.

### Q2. How does Prometheus collect metrics?

**Answer:**

Prometheus commonly uses a pull-based model. It periodically scrapes metrics from configured or discovered targets, usually through a `/metrics` endpoint.

### Q3. What is Node Exporter?

**Answer:**

Node Exporter is a Prometheus exporter that exposes operating-system and infrastructure-level metrics such as CPU, memory, filesystem, disk, network, and process-related information.

### Q4. Why does Node Exporter commonly run as a DaemonSet?

**Answer:**

Node Exporter collects metrics from the node on which it runs. A DaemonSet ensures that a Node Exporter Pod is scheduled on each eligible Kubernetes node.

### Q5. What is kube-state-metrics?

**Answer:**

kube-state-metrics exposes metrics representing the state of Kubernetes objects. It communicates with the Kubernetes API server and exposes information about Pods, Deployments, ReplicaSets, Services, ConfigMaps, Jobs, and other supported resources.

### Q6. What is the difference between Node Exporter and kube-state-metrics?

**Answer:**

Node Exporter focuses primarily on operating-system and node-level metrics, while kube-state-metrics focuses on Kubernetes object-state information.

For example:

```text
Node Exporter
→ CPU
→ Memory
→ Disk
→ Network

kube-state-metrics
→ Pod status
→ Deployment replicas
→ Container restarts
→ Kubernetes object state
```

### Q7. What is PromQL?

**Answer:**

PromQL stands for Prometheus Query Language. It is used to select, filter, aggregate, and analyze time-series data stored in Prometheus.

### Q8. What does this query do?

```promql
kube_pod_container_status_restarts_total{
  namespace="default"
}
```

**Answer:**

It selects the cumulative container restart metric and filters the results to the `default` namespace.

### Q9. How would you find restart information for a specific Pod?

**Answer:**

We can filter the metric using the `pod` label:

```promql
kube_pod_container_status_restarts_total{
  namespace="default",
  pod="busybox-crash"
}
```

### Q10. What is a time series database?

**Answer:**

A time series database stores values associated with timestamps. Prometheus stores metric samples along with labels and timestamps so that system and application behavior can be analyzed over time.

### Q11. What is Alertmanager?

**Answer:**

Alertmanager handles alerts generated by Prometheus. It can group, route, suppress, and silence alerts and send notifications to configured destinations such as email or messaging systems.

### Q12. What is the difference between Prometheus and Grafana?

**Answer:**

Prometheus is primarily responsible for collecting, storing, querying, and evaluating metrics. Grafana is primarily a visualization and dashboard platform that can query Prometheus and many other data sources.

### Q13. Can Grafana work without Prometheus?

**Answer:**

Yes. Grafana supports multiple data sources. Prometheus is one of them, but Grafana can also work with other supported systems such as InfluxDB and Graphite.

### Q14. Why is Grafana commonly used with Prometheus?

**Answer:**

Prometheus provides powerful metric collection and querying, while Grafana provides richer visualization, dashboards, filtering, time-range controls, and presentation capabilities.

Together they provide a strong monitoring and visualization workflow.

### Q15. What are the common Prometheus metric types?

**Answer:**

The commonly discussed Prometheus metric types are:

```text
Counter
Gauge
Histogram
Summary
```

A Counter generally increases, a Gauge can increase or decrease, a Histogram represents observations using buckets, and a Summary tracks observations and configured quantiles.

### Q16. What is a custom metric?

**Answer:**

A custom metric is an application-specific metric exposed through instrumentation.

Examples include:

```text
HTTP requests
Login count
Payment transactions
Application errors
Request latency
```

### Q17. What is ServiceMonitor?

**Answer:**

ServiceMonitor is a Kubernetes custom resource used with the Prometheus Operator ecosystem to declaratively define Kubernetes Services that should be monitored by Prometheus.

### Q18. Why use ServiceMonitor?

**Answer:**

In a large Kubernetes environment, manually maintaining every application as a Prometheus scrape target can become difficult.

ServiceMonitor provides a Kubernetes-native declarative mechanism for selecting Services and defining how their metrics should be scraped.

### Q19. Does Prometheus need to scrape every Service in a Kubernetes cluster?

**Answer:**

No.

Prometheus should scrape the targets that intentionally provide useful metrics according to the monitoring design.

Scraping unnecessary endpoints can increase monitoring overhead and resource consumption.

### Q20. How would you troubleshoot a missing Prometheus metric?

**Answer:**

I would follow the complete metric path:

```text
Application / Exporter
        ↓
/metrics endpoint
        ↓
Prometheus target
        ↓
Prometheus TSDB
        ↓
PromQL
        ↓
Grafana / Alerting
```

I would verify:

1. The exporter or application is running.
2. The `/metrics` endpoint is available.
3. The target is configured or discovered by Prometheus.
4. The target is healthy.
5. The metric exists.
6. The expected labels exist.
7. The PromQL query is correct.
8. The selected time range contains data.

### Q21. How would you monitor Pod crashes?

**Answer:**

For Kubernetes container restart information, kube-state-metrics provides:

```promql
kube_pod_container_status_restarts_total
```

We can filter it by namespace and Pod:

```promql
kube_pod_container_status_restarts_total{
  namespace="default",
  pod="busybox-crash"
}
```

The result can then be viewed in Prometheus or visualized in Grafana.

### Q22. How would you present Kubernetes monitoring information to management?

**Answer:**

I would create a Grafana dashboard containing business- and operationally-relevant metrics such as:

```text
Application health
Request rate
Error rate
Latency
Pod restarts
CPU utilization
Memory utilization
Service availability
```

This provides a visual summary without requiring management users to execute Kubernetes commands or write PromQL queries.
