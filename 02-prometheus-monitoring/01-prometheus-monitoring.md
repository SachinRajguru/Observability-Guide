
## Prometheus — Setting Up Monitoring

> **File:** `01-prometheus-monitoring.md`

> **Primary Platform:** AWS EKS / Kubernetes
>
> **Focus:** Prometheus fundamentals, architecture, `kube-prometheus-stack`, Grafana, Alertmanager, and Kubernetes monitoring
>
> **Level:** Implementation / Practical
>
> **Prerequisites:** Basic Kubernetes, Helm, AWS CLI, `kubectl`, and EKS knowledge

## Table of Contents

1. [Learning Objectives](#1-learning-objectives)
2. [Metrics vs. Monitoring](#2-metrics-vs-monitoring)
3. [What Is Prometheus?](#3-what-is-prometheus)
4. [Prometheus Architecture](#4-prometheus-architecture)
   * [4.1 Prometheus Server](#41-prometheus-server)
   * [4.2 Service Discovery](#42-service-discovery)
   * [4.3 Pushgateway](#43-pushgateway)
   * [4.4 Alertmanager](#44-alertmanager)
   * [4.5 Exporters](#45-exporters)
   * [4.6 Prometheus Web UI](#46-prometheus-web-ui)
   * [4.7 Grafana](#47-grafana)
   * [4.8 HTTP API and Clients](#48-http-api-and-clients)
5. [Prometheus in Kubernetes](#5-prometheus-in-kubernetes)
   * [5.1 kube-prometheus-stack](#51-kube-prometheus-stack)
   * [5.2 Prometheus Operator](#52-prometheus-operator)
6. [Lab Architecture](#6-lab-architecture)
7. [Prerequisites](#7-prerequisites)
8. [Step 1 — Create the EKS Cluster](#8-step-1--create-the-eks-cluster)
   * [8.1 Create the EKS Control Plane](#81-create-the-eks-control-plane)
   * [8.2 Associate the IAM OIDC Provider](#82-associate-the-iam-oidc-provider)
   * [8.3 Create the Managed Node Group](#83-create-the-managed-node-group)
   * [8.4 Configure kubectl](#84-configure-kubectl)
9. [Step 2 — Add the Prometheus Community Helm Repository](#9-step-2--add-the-prometheus-community-helm-repository)
10. [Step 3 — Create the Monitoring Namespace](#10-step-3--create-the-monitoring-namespace)
11. [Step 4 — Install kube-prometheus-stack](#11-step-4--install-kube-prometheus-stack)
    * [11.1 Project Structure](#111-project-structure)
    * [11.2 Create the Custom Values File](#112-create-the-custom-values-file)
    * [11.3 Install the Helm Chart](#113-install-the-helm-chart)
12. [Step 5 — Verify the Installation](#12-step-5--verify-the-installation)
13. [Step 6 — Access Prometheus](#13-step-6--access-prometheus)
14. [Step 7 — Access Grafana](#14-step-7--access-grafana)
15. [Step 8 — Access Alertmanager](#15-step-8--access-alertmanager)
16. [Understanding the Custom Configuration](#16-understanding-the-custom-configuration)
17. [Basic Prometheus Validation](#17-basic-prometheus-validation)
18. [Troubleshooting](#18-troubleshooting)
19. [Cleanup](#19-cleanup)
20. [What We Implemented](#20-what-we-implemented)
21. [Key Takeaways](#21-key-takeaways)
22. [Interview Questions and Answers](#22-interview-questions-and-answers)
23. [Final Mental Model](#23-final-mental-model)

## 1. Learning Objectives

By completing this section, we should be able to:

* Understand the difference between metrics and monitoring.
* Understand what Prometheus is and why it is widely used.
* Understand the major components of Prometheus architecture.
* Understand how Prometheus collects and stores time-series metrics.
* Understand the Prometheus pull model.
* Understand service discovery in Kubernetes.
* Understand the purpose of exporters.
* Understand when Pushgateway is appropriate.
* Understand the role of Alertmanager.
* Understand the role of Grafana.
* Understand Prometheus Operator and `kube-prometheus-stack`.
* Create an AWS EKS cluster for the monitoring lab.
* Install the Prometheus Community Helm repository.
* Deploy `kube-prometheus-stack`.
* Verify Prometheus, Grafana, and Alertmanager.
* Access monitoring components using Kubernetes port forwarding.
* Execute basic PromQL queries.
* Understand the purpose of the custom Helm values file.
* Troubleshoot common monitoring-stack issues.
* Clean up the AWS and Kubernetes resources created for the lab.

## 2. Metrics vs. Monitoring

Before working with Prometheus, we need to understand the difference between **metrics** and **monitoring**.

### 2.1 What Are Metrics?

Metrics are numerical measurements that describe the state or behavior of a system over time.

Examples include:

* CPU utilization
* Memory utilization
* Disk usage
* Network traffic
* HTTP request count
* Request latency
* Error count
* Number of running pods
* Application throughput

For example:

```text
CPU Usage       = 72%
Memory Usage    = 65%
Request Rate    = 1,200 requests/sec
Error Rate      = 1.2%
API Latency     = 250 ms
```

These values are **metrics**.

#### Simple Analogy

Consider a fitness tracker:

```text
Steps       = 8,500
Heart Rate  = 72 BPM
Temperature = 30°C
```

These are measurements.

Similarly, in IT infrastructure:

```text
CPU Usage     = 72%
Memory Usage  = 65%
Request Rate  = 1,200/sec
```

These are system measurements.

### 2.2 What Is Monitoring?

Monitoring is the process of continuously collecting, evaluating, and observing system measurements to understand system health and detect abnormal conditions.

For example:

```text
Metric:

CPU Usage = 95%
```

A monitoring system can evaluate the metric against a condition:

```text
CPU Usage > 90%
        │
        ▼
   Alert Condition
        │
        ▼
       Alert
```

Therefore:

> Metrics are measurements. Monitoring uses measurements to understand system health, detect problems, and generate alerts.

#### Simple Mental Model

```text
Metrics
   │
   ▼
Measurements
   │
   ▼
Monitoring
   │
   ├── Observe
   ├── Evaluate
   ├── Detect
   └── Alert
```

Prometheus primarily works with **time-series metrics** and provides capabilities for querying and alerting on those metrics.

## 3. What Is Prometheus?

Prometheus is an open-source monitoring and alerting toolkit designed primarily for collecting, storing, querying, and alerting on time-series metrics.

Prometheus was originally developed at SoundCloud and is now a graduated project within the **Cloud Native Computing Foundation (CNCF)**.

Prometheus is commonly used for monitoring:

* Linux servers
* Applications
* Containers
* Kubernetes clusters
* Databases
* Cloud infrastructure
* Network components
* Custom applications

Important Prometheus capabilities include:

* Time-series metric storage
* PromQL query language
* Metric scraping
* Service discovery
* Alert rule evaluation
* Exporter-based monitoring
* HTTP API
* Integration with visualization platforms such as Grafana

### 3.1 Why Prometheus?

Modern infrastructure generates a large amount of operational data.

For example:

```text
Kubernetes Cluster
│
├── Nodes
├── Pods
├── Containers
├── Applications
├── Services
└── Infrastructure
```

Each component can generate metrics.

Prometheus provides a centralized system for collecting, storing, querying, and evaluating those metrics.

A simplified flow is:

```text
Metric Sources
      │
      ▼
Prometheus
      │
      ├── Store metrics
      │
      ├── Query metrics
      │
      └── Evaluate alert rules
      │
      ├───────────────┐
      ▼               ▼
   Grafana        Alertmanager
      │               │
      ▼               ▼
 Dashboards       Notifications
```

## 4. Prometheus Architecture

The Prometheus ecosystem consists of multiple components that work together to collect, store, query, visualize, and manage alerts.

![Prometheus Architecture](images/prometheus-architecture.gif)

A simplified architecture is:

```text
                         ┌─────────────────┐
                         │ Service         │
                         │ Discovery       │
                         └────────┬────────┘
                                  │
                                  ▼
┌──────────────┐           ┌───────────────┐
│ Applications │──────────►│               │
└──────────────┘           │               │
                           │   Prometheus  │
┌──────────────┐           │    Server     │
│  Exporters   │──────────►│               │
└──────────────┘           │               │
                           └───────┬───────┘
                                   │
                     ┌─────────────┼─────────────┐
                     │             │             │
                     ▼             ▼             ▼
                   TSDB        PromQL/API    Alert Rules
                     │                           │
                     ▼                           ▼
                  Storage                   Alertmanager
                                                 │
                                                 ▼
                                            Notifications

                     Prometheus
                          │
                          ▼
                       Grafana
                          │
                          ▼
                     Dashboards
```

Let's understand each component.

### 4.1 Prometheus Server

The **Prometheus Server** is the core component of Prometheus.

It is responsible for:

* Discovering scrape targets.
* Scraping metrics.
* Storing metrics.
* Evaluating recording and alerting rules.
* Executing PromQL queries.
* Exposing an HTTP API.
* Sending firing alerts to Alertmanager.

Conceptually, the Prometheus Server can be viewed as:

```text
Prometheus Server
│
├── Retrieval
├── TSDB
├── Rule Evaluation
└── HTTP Server
```

#### 4.1.1 Retrieval

The retrieval component collects metrics from configured targets.

Prometheus generally follows a **pull model**.

```text
Prometheus
     │
     │ HTTP GET /metrics
     ▼
Target
     │
     ▼
Metrics
```

For example:

```text
Prometheus ─────► Node Exporter
Prometheus ─────► Application
Prometheus ─────► Kubernetes target
```

Prometheus periodically scrapes the target's metrics endpoint.

#### 4.1.2 Time-Series Database

Prometheus stores collected metrics as **time-series data**.

A time series is identified by a metric name and its label set.

For example:

```text
http_requests_total{
    method="GET",
    service="frontend",
    status="200"
}
```

Values are collected over time:

```text
10:00 → 1,000
10:01 → 1,120
10:02 → 1,250
10:03 → 1,390
```

Prometheus includes its own local time-series database (TSDB).

By default, Prometheus stores its local TSDB data on disk.

> **Important:** Prometheus local storage should not automatically be considered unlimited long-term storage. Production environments that require longer retention, centralized querying, or cross-cluster storage commonly use additional systems such as Thanos, Grafana Mimir, or other compatible storage solutions.

#### 4.1.3 PromQL

**PromQL**, or Prometheus Query Language, is the query language used to select, filter, aggregate, and analyze Prometheus metrics.

For example:

```promql
up
```

This can be used to inspect the availability of monitored targets.

Another example:

```promql
rate(http_requests_total[5m])
```

This calculates the per-second rate of increase of the HTTP request counter over the previous five minutes.

PromQL is used for:

* Metric queries
* Dashboards
* Alerts
* Recording rules
* Performance analysis
* Troubleshooting

Detailed PromQL usage will be covered in later sections.

#### 4.1.4 HTTP Server

Prometheus exposes an HTTP interface that allows users and other systems to:

* Execute PromQL queries.
* Access metrics.
* Retrieve metadata.
* Access Prometheus APIs.
* Use the Prometheus Web UI.

The Web UI itself uses the Prometheus HTTP interface.

### 4.2 Service Discovery

Service discovery automatically identifies monitoring targets so Prometheus can scrape the appropriate endpoints.

This becomes especially important in dynamic environments.

In a traditional environment, we might have:

```text
server-01
server-02
server-03
```

The list may remain relatively stable.

In Kubernetes:

```text
Pod A
Pod B
Pod C
   │
   ▼
Pod deleted
   │
   ▼
Pod D created
```

Monitoring targets can change continuously.

Maintaining a static list of every pod would therefore be impractical.

Kubernetes service discovery allows Prometheus to discover targets dynamically.

#### 4.2.1 Kubernetes Service Discovery

Prometheus can integrate with the Kubernetes API to discover resources such as:

* Pods
* Services
* Nodes
* Endpoints
* EndpointSlices
* Other Kubernetes resources depending on configuration

A simplified flow is:

```text
Kubernetes API
      │
      ▼
Service Discovery
      │
      ▼
Prometheus
      │
      ▼
Scrape Targets
```

This allows monitoring to adapt as the Kubernetes environment changes.

#### 4.2.2 File-Based Service Discovery

Prometheus also supports **file-based service discovery**.

Targets can be supplied through files and updated by an external system.

Conceptually:

```text
External System
      │
      ▼
targets.json
      │
      ▼
Prometheus
      │
      ▼
Scrape Targets
```

This can be useful when targets are managed externally and Kubernetes-based service discovery is not being used.

### 4.3 Pushgateway

Prometheus primarily follows a **pull-based model**.

However, some workloads are short-lived and may finish before Prometheus has an opportunity to scrape them.

For example:

```text
Batch Job
   │
   ├── Starts
   ├── Executes
   └── Finishes
```

A short-lived job may therefore be difficult to monitor using the normal scrape model.

**Pushgateway** provides a mechanism for such jobs to expose metrics for Prometheus to scrape.

The flow becomes:

```text
Short-Lived Job
      │
      │ Push metrics
      ▼
 Pushgateway
      │
      │ Prometheus scrapes
      ▼
 Prometheus
```

#### Suitable Examples

Pushgateway can be useful for:

* Batch jobs
* Scheduled scripts
* Short-lived administrative jobs

> **Important:** Pushgateway should not be used as a general replacement for Prometheus's normal pull model. It is intended for specific short-lived job scenarios.

### 4.4 Alertmanager

Prometheus can evaluate alerting rules based on metrics.

When an alert rule enters a firing state, Prometheus sends the alert to **Alertmanager**.

```text
Prometheus
    │
    │ Alert
    ▼
Alertmanager
    │
    ├── Group
    ├── Deduplicate
    ├── Silence
    ├── Inhibit
    └── Route
         │
         ├── Email
         ├── Slack
         └── PagerDuty
```

Alertmanager is responsible for **managing alerts and notifications**, rather than collecting metrics.

Its responsibilities include:

* Deduplication
* Grouping
* Routing
* Silencing
* Inhibition
* Notification handling

For example:

```text
CPU > 90%
     │
     ▼
Prometheus Alert Rule
     │
     ▼
Alertmanager
     │
     ▼
Notification
```

#### Important Distinction

```text
Prometheus
    │
    ├── Collects metrics
    ├── Stores metrics
    ├── Queries metrics
    └── Evaluates alert rules
             │
             ▼
       Alertmanager
             │
             ├── Groups
             ├── Deduplicates
             ├── Routes
             └── Notifies
```

### 4.5 Exporters

An **exporter** is a component that exposes metrics from a system or application in a format that Prometheus can scrape.

Exporters are especially useful when the monitored system does not natively expose Prometheus metrics.

The general flow is:

```text
System
  │
  ▼
Exporter
  │
  ▼
/metrics
  │
  ▼
Prometheus
```

Common examples include:

* **Node Exporter** — exposes host-level Linux metrics.
* **MySQL Exporter** — exposes MySQL metrics.
* Other exporters — expose metrics from databases, infrastructure systems, and applications.

For example:

```text
Linux Host
    │
    ▼
Node Exporter
    │
    ▼
/metrics
    │
    ▼
Prometheus
```

#### 4.5.1 Node Exporter

**Node Exporter** exposes hardware and operating-system-level metrics from Linux hosts.

Examples include:

* CPU statistics
* Memory statistics
* Filesystem statistics
* Network statistics
* Load information

Conceptually:

```text
Linux Node
    │
    ▼
Node Exporter
    │
    ▼
Prometheus
```

In `kube-prometheus-stack`, Node Exporter is commonly deployed across Kubernetes nodes using a DaemonSet.

### 4.6 Prometheus Web UI

Prometheus provides a web-based user interface.

The Web UI allows us to:

* Execute PromQL queries.
* Explore metrics.
* Inspect query results.
* View targets.
* Review alerting information.
* Troubleshoot metric collection.

A simplified workflow is:

```text
Prometheus UI
     │
     ▼
Enter PromQL
     │
     ▼
Execute Query
     │
     ▼
View Result
```

The Web UI is particularly useful for troubleshooting and ad-hoc metric exploration.

For richer dashboards and visualizations, Grafana is commonly used.

### 4.7 Grafana

Grafana is a visualization and dashboarding platform that can use Prometheus as a data source.

The relationship can be represented as:

```text
Prometheus
    │
    │ Metrics
    ▼
 Grafana
    │
    ├── Dashboards
    ├── Panels
    ├── Graphs
    └── Visualization
```

A simple mental model is:

```text
Prometheus
    │
    ├── Collect
    ├── Store
    └── Query
         │
         ▼
      Grafana
         │
         ├── Visualize
         ├── Dashboard
         └── Explore
```

Together, Prometheus and Grafana provide a powerful monitoring experience.

> **Note:** Grafana also has its own alerting capabilities. In this lab, however, Prometheus alert rules and Alertmanager are the primary alerting flow.

### 4.8 HTTP API and Clients

Prometheus exposes an HTTP API that can be consumed by other applications.

This allows external systems to:

* Query metrics.
* Retrieve metric data.
* Integrate Prometheus into automation.
* Build custom monitoring applications.

Conceptually:

```text
Application
     │
     │ HTTP API
     ▼
Prometheus
     │
     ▼
Metrics
```

## 5. Prometheus in Kubernetes

Prometheus is particularly well suited to Kubernetes environments because Kubernetes is highly dynamic.

A Kubernetes cluster can contain:

```text
Cluster
│
├── Nodes
├── Pods
├── Containers
├── Services
├── Deployments
└── Applications
```

Resources can be:

* Created
* Deleted
* Restarted
* Rescheduled
* Scaled

Therefore, monitoring must be able to discover targets dynamically.

### 5.1 kube-prometheus-stack

For Kubernetes, instead of installing and configuring every component independently, we can use the **`kube-prometheus-stack` Helm chart**.

It provides a Kubernetes monitoring stack that commonly includes:

```text
kube-prometheus-stack
│
├── Prometheus
├── Alertmanager
├── Grafana
├── Prometheus Operator
├── Node Exporter
├── kube-state-metrics
├── Alerting rules
├── Recording rules
├── Grafana dashboards
└── Prometheus-related CRDs
```

The exact resources and behavior depend on the chart version and values configuration.

### 5.2 Prometheus Operator

The **Prometheus Operator** provides Kubernetes-native management of Prometheus resources.

Instead of maintaining every Prometheus configuration manually, Kubernetes custom resources can be used to describe monitoring configuration.

Important resources include:

```text
Prometheus
ServiceMonitor
PodMonitor
PrometheusRule
Alertmanager
AlertmanagerConfig
```

For example:

```text
Service
   │
   ▼
ServiceMonitor
   │
   ▼
Prometheus Operator
   │
   ▼
Prometheus
   │
   ▼
Scrape Target
```

This makes Prometheus configuration easier to manage in Kubernetes.

#### 5.2.1 ServiceMonitor

A `ServiceMonitor` tells the Prometheus Operator how services should be discovered and scraped.

A simplified example is:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: example-app
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: example-app

  endpoints:
    - port: http
      path: /metrics
      interval: 30s
```

The exact selector and endpoint configuration must match the application's Kubernetes Service.

## 6. Lab Architecture

In this lab, we will create an AWS EKS cluster and deploy the Prometheus monitoring stack.

The architecture will be:

```text
                         AWS
                          │
                          ▼
                    EKS Cluster
                          │
             ┌────────────┴────────────┐
             │                         │
        Control Plane              Node Group
                                       │
                           ┌───────────┼───────────┐
                           │           │           │
                          Pod         Pod         Pod
                           │           │           │
                           └───────────┼───────────┘
                                       │
                                       ▼
                              monitoring namespace
                                       │
                         ┌─────────────┼─────────────┐
                         │             │             │
                         ▼             ▼             ▼
                    Prometheus      Grafana      Alertmanager
                         │
                         ▼
                      Metrics
```

### Monitoring Flow

```text
Kubernetes Resources
        │
        ▼
Service Discovery
        │
        ▼
Prometheus
        │
        ├── TSDB
        ├── PromQL
        └── Alert Rules
              │
       ┌──────┴──────┐
       ▼             ▼
    Grafana      Alertmanager
       │             │
       ▼             ▼
  Dashboards    Notifications
```

## 7. Prerequisites

Before starting the lab, ensure the following tools are installed:

| Tool      | Purpose                        |
| --------- | ------------------------------ |
| AWS CLI   | Interact with AWS              |
| `eksctl`  | Create and manage EKS clusters |
| `kubectl` | Interact with Kubernetes       |
| Helm 3    | Deploy the monitoring stack    |
| Git       | Manage the repository          |

Verify the installations.

### AWS CLI

```bash
aws --version
```

### eksctl

```bash
eksctl version
```

### kubectl

```bash
kubectl version --client
```

### Helm

```bash
helm version
```

We also need AWS credentials with sufficient permissions to create and manage the resources required by this lab.

> **Production recommendation:** Use least-privilege IAM permissions. Avoid using unrestricted administrator permissions for production workloads simply because they are convenient for a lab.

## 8. Step 1 — Create the EKS Cluster

We will create an EKS cluster named:

```text
observability
```

in:

```text
us-east-1
```

The cluster will initially be created without a node group.

### 8.1 Create the EKS Control Plane

#### DO THIS

```bash
eksctl create cluster \
  --name observability \
  --region us-east-1 \
  --zones us-east-1a,us-east-1b \
  --without-nodegroup
```

#### What does this do?

The command creates the EKS control plane without creating worker nodes yet.

Important parameters:

| Parameter                       | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `--name observability`          | EKS cluster name                         |
| `--region us-east-1`            | AWS region                               |
| `--zones us-east-1a,us-east-1b` | Availability Zones                       |
| `--without-nodegroup`           | Creates the cluster without worker nodes |

After the command completes, we will have the EKS control plane but no worker nodes.

### 8.2 Associate the IAM OIDC Provider

EKS supports IAM integration for Kubernetes workloads.

The IAM OIDC provider is commonly used when Kubernetes workloads need to assume AWS IAM roles through mechanisms such as IAM Roles for Service Accounts.

#### DO THIS

```bash
eksctl utils associate-iam-oidc-provider \
  --region us-east-1 \
  --cluster observability \
  --approve
```

#### EXPECT

The command should complete successfully and indicate that the IAM OIDC provider has been associated with the cluster.

#### Why is this useful?

Conceptually:

```text
Kubernetes Pod
      │
      ▼
Kubernetes ServiceAccount
      │
      ▼
IAM Role
      │
      ▼
AWS API
```

This allows workloads to access AWS resources without embedding long-lived AWS access keys inside containers.

> **Important:** OIDC is not required merely for Prometheus to collect Kubernetes metrics. It becomes relevant when Kubernetes workloads need AWS IAM permissions.

### 8.3 Create the Managed Node Group

Now we create a managed worker node group.

#### DO THIS

```bash
eksctl create nodegroup \
  --cluster observability \
  --region us-east-1 \
  --name observability-ng-private \
  --node-type t3.medium \
  --nodes-min 2 \
  --nodes-max 3 \
  --node-volume-size 20 \
  --managed \
  --node-private-networking
```

#### What does this do?

This creates a managed node group for the EKS cluster.

Important settings:

```text
Node type       → t3.medium
Minimum nodes   → 2
Maximum nodes   → 3
Volume size     → 20 GB
Networking      → Private
```

#### Why use private worker nodes?

Private worker nodes reduce direct internet exposure.

The architecture is conceptually:

```text
Internet
    │
    X
    │
Public Subnets
    │
    ▼
EKS Control Plane
    │
    ▼
Private Subnets
    │
    ├── Worker Node
    ├── Worker Node
    └── Worker Node
```

> **Important:** Private nodes require appropriate VPC connectivity, such as NAT gateways or required VPC endpoints, so that nodes can communicate with AWS services and retrieve container images as needed.

#### IAM Permissions

The node group and workloads should receive only the permissions they actually require.

Avoid adding broad access flags for unrelated services unless the lab or application explicitly needs them.

For example, permissions for ECR, ALB Controller, ExternalDNS, or App Mesh should be configured only when those components are actually being used.

### 8.4 Configure kubectl

After creating the cluster, configure `kubectl` to communicate with the EKS cluster.

#### DO THIS

```bash
aws eks update-kubeconfig \
  --name observability \
  --region us-east-1
```

#### VERIFY

```bash
kubectl get nodes
```

#### EXPECT

The EKS worker nodes should eventually appear in the `Ready` state.

Example:

```text
NAME                                         STATUS   ROLES    AGE   VERSION
ip-xxx-xxx-xxx-xxx.ec2.internal             Ready    <none>   ...   ...
ip-xxx-xxx-xxx-xxx.ec2.internal             Ready    <none>   ...   ...
```

If the nodes are not `Ready`, investigate the node group before continuing.

## 9. Step 2 — Add the Prometheus Community Helm Repository

The Prometheus Community maintains Helm charts for Prometheus-related components.

### 9.1 Add the Repository

#### DO THIS

```bash
helm repo add prometheus-community \
  https://prometheus-community.github.io/helm-charts
```

#### EXPECT

```text
"prometheus-community" has been added to your repositories
```

### 9.2 Update Repository Information

#### DO THIS

```bash
helm repo update
```

This retrieves the latest chart metadata from the configured Helm repositories.

### 9.3 Verify the Repository

#### DO THIS

```bash
helm repo list
```

#### EXPECT

The `prometheus-community` repository should be listed.

### 9.4 Check Available Chart Versions

Before installing a production environment, it is good practice to review available versions.

#### DO THIS

```bash
helm search repo prometheus-community/kube-prometheus-stack --versions
```

This allows us to identify the chart version that we want to test and pin.

> **Best practice:** Pin the chart version used by a production deployment instead of relying on whatever happens to be the latest version at installation time.

## 10. Step 3 — Create the Monitoring Namespace

We will keep the monitoring components in a dedicated namespace.

#### DO THIS

```bash
kubectl create namespace monitoring
```

Alternatively:

```bash
kubectl create ns monitoring
```

#### VERIFY

```bash
kubectl get namespaces
```

#### EXPECT

The following namespace should appear:

```text
monitoring
```

## 11. Step 4 — Install kube-prometheus-stack

The `kube-prometheus-stack` Helm chart provides the Kubernetes monitoring stack.

### 11.1 Project Structure

The project can use the following structure:

```text
02-prometheus/
│
├── README.md
├── 01-prometheus-monitoring.md
├── custom_kube_prometheus_stack.yml
└── images/
    └── prometheus-architecture.gif
```

The Markdown file contains the guide.

The values file contains our Helm configuration.

The architecture image provides a visual reference for the Prometheus ecosystem.

### 11.2 Create the Custom Values File

Create:

```text
02-prometheus/custom_kube_prometheus_stack.yml
```

Use the following lab configuration:

```yaml
grafana:
  # Lab-only administrator password.
  # Do not use a simple hard-coded password in production.
  adminPassword: prom-operator

alertmanager:
  alertmanagerSpec:
    # Select AlertmanagerConfig resources that contain this label.
    alertmanagerConfigSelector:
      matchLabels:
        release: monitoring

    # Run two Alertmanager replicas for the lab.
    replicas: 2
```

#### Important

The `alertmanagerConfigSelector` does not create an `AlertmanagerConfig`.

It only tells the Prometheus Operator which `AlertmanagerConfig` resources should be selected based on their labels.

For example, an `AlertmanagerConfig` resource could contain:

```yaml
metadata:
  labels:
    release: monitoring
```

The exact Alertmanager configuration and routing rules are covered separately when we implement alerting.

### 11.3 Install the Helm Chart

Navigate to the directory containing the values file.

#### DO THIS

```bash
cd 02-prometheus
```

Then install the chart:

```bash
helm install monitoring \
  prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values ./custom_kube_prometheus_stack.yml
```

#### What does this do?

The command:

1. Uses the `kube-prometheus-stack` Helm chart.
2. Creates a Helm release named `monitoring`.
3. Deploys resources into the `monitoring` namespace.
4. Applies the configuration from `custom_kube_prometheus_stack.yml`.

The relationship is:

```text
Helm Repository
      │
      ▼
kube-prometheus-stack
      │
      ▼
Helm Release
   monitoring
      │
      ▼
monitoring namespace
      │
      ├── Prometheus
      ├── Grafana
      ├── Alertmanager
      ├── Operator
      ├── Node Exporter
      └── kube-state-metrics
```

#### 11.3.1 Verify Helm Installation

#### DO THIS

```bash
helm list -n monitoring
```

#### EXPECT

The release should appear with a successful status:

```text
NAME        NAMESPACE    STATUS
monitoring  monitoring   deployed
```

#### 11.3.2 Idempotent Installation

For repeated deployments, upgrades, or automation, we can use:

```bash
helm upgrade --install monitoring \
  prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values ./custom_kube_prometheus_stack.yml
```

This command:

* Installs the release if it does not exist.
* Upgrades the release if it already exists.

This pattern is especially useful in CI/CD automation.

## 12. Step 5 — Verify the Installation

After installation, verify that the monitoring components were created successfully.

### 12.1 Check All Resources

#### DO THIS

```bash
kubectl get all -n monitoring
```

#### EXPECT

We should see resources associated with:

* Prometheus
* Grafana
* Alertmanager
* Prometheus Operator
* Node Exporter
* kube-state-metrics
* Services
* ReplicaSets
* StatefulSets

The exact names and resource counts depend on the chart version and configuration.

### 12.2 Check Pods

#### DO THIS

```bash
kubectl get pods -n monitoring
```

#### EXPECT

The monitoring pods should eventually reach:

```text
Running
```

and the required containers should become ready.

If a pod remains in:

```text
Pending
ContainerCreating
CrashLoopBackOff
ImagePullBackOff
```

we should investigate before continuing.

### 12.3 Check Services

#### DO THIS

```bash
kubectl get svc -n monitoring
```

This allows us to identify the services used by:

* Prometheus
* Grafana
* Alertmanager

### 12.4 Check StatefulSets

#### DO THIS

```bash
kubectl get statefulsets -n monitoring
```

Prometheus and Alertmanager commonly use StatefulSets because they are stateful components with stable identities and storage-related requirements.

### 12.5 Check ServiceMonitors

#### DO THIS

```bash
kubectl get servicemonitors -A
```

#### EXPECT

We should see ServiceMonitor resources created by the monitoring stack.

### 12.6 Check PodMonitors

#### DO THIS

```bash
kubectl get podmonitors -A
```

Depending on the installed chart version and configuration, PodMonitor resources may also be present.

### 12.7 Check Prometheus Rules

#### DO THIS

```bash
kubectl get prometheusrules -A
```

These resources contain recording and alerting rules managed by the Prometheus Operator.

### 12.8 Check Custom Resource Definitions

#### DO THIS

```bash
kubectl get crd | grep monitoring.coreos.com
```

These CRDs are provided by the Prometheus Operator ecosystem.

## 13. Step 6 — Access Prometheus

Prometheus can be accessed locally using Kubernetes port forwarding.

### 13.1 Identify the Prometheus Service

First inspect the services:

```bash
kubectl get svc -n monitoring
```

Look for the Prometheus service.

The exact service name can vary depending on the Helm release and chart configuration.

For this lab, the commonly used service is:

```text
prometheus-operated
```

### 13.2 Port-Forward Prometheus

#### DO THIS

```bash
kubectl port-forward \
  -n monitoring \
  service/prometheus-operated \
  9090:9090
```

#### EXPECT

The terminal should indicate that local port `9090` is being forwarded.

Open:

```text
http://localhost:9090
```

in a browser.

> If `prometheus-operated` does not exist, run `kubectl get svc -n monitoring` and use the Prometheus service created by the installed release.

### 13.3 Verify Prometheus with PromQL

In the Prometheus UI, execute:

```promql
up
```

#### Expected Meaning

The result represents the health of discovered scrape targets.

Conceptually:

```text
1 → Target is up
0 → Target is down
```

This is our first practical interaction with Prometheus metrics.

### 13.4 Access Prometheus from a Remote VM

If `kubectl` is running on a remote EC2 instance or another cloud VM and we need temporary access from another machine, port forwarding normally binds to the local loopback interface.

For a temporary lab environment, we can bind the port-forward to all interfaces:

```bash
kubectl port-forward \
  --address 0.0.0.0 \
  -n monitoring \
  service/prometheus-operated \
  9090:9090
```

We can then access the VM's reachable IP and port if the network and firewall/security-group rules allow it.

> **Security warning:** Do not expose Prometheus directly to the public internet. For production environments, use an authenticated and secured access mechanism such as an internal ingress, VPN, bastion, private networking, or another approved access pattern.

## 14. Step 7 — Access Grafana

Grafana is deployed as part of `kube-prometheus-stack`.

### 14.1 Identify the Grafana Service

#### DO THIS

```bash
kubectl get svc -n monitoring
```

Look for the Grafana service.

For the Helm release used in this guide, it is commonly:

```text
monitoring-grafana
```

The exact name should always be verified using `kubectl get svc`.

### 14.2 Retrieve Grafana Credentials

The custom values file contains:

```yaml
grafana:
  adminPassword: prom-operator
```

Therefore, for this lab:

```text
Username: admin
Password: prom-operator
```

> **Important:** This is a lab-only password. Do not use this password in production.

#### 14.2.1 Retrieve Credentials from the Kubernetes Secret

If the credentials are unknown, inspect the Secrets:

#### DO THIS

```bash
kubectl get secrets -n monitoring
```

For the default release naming, the Grafana Secret is commonly:

```text
monitoring-grafana
```

Retrieve the username:

```bash
kubectl get secret \
  monitoring-grafana \
  -n monitoring \
  -o jsonpath='{.data.admin-user}' | base64 -d
```

Retrieve the password:

```bash
kubectl get secret \
  monitoring-grafana \
  -n monitoring \
  -o jsonpath='{.data.admin-password}' | base64 -d
```

> The exact Secret name can vary. If `monitoring-grafana` does not exist, use `kubectl get secrets -n monitoring` to identify the actual Secret.

### 14.3 Port-Forward Grafana

#### DO THIS

```bash
kubectl port-forward \
  -n monitoring \
  service/monitoring-grafana \
  8080:80
```

#### EXPECT

Local port `8080` should be forwarded to the Grafana service.

Open:

```text
http://localhost:8080
```

Log in using the configured credentials.

### 14.4 Verify Grafana

After logging in, verify that:

* Grafana is accessible.
* Prometheus is configured as a data source.
* Kubernetes dashboards are available.
* Metrics can be visualized.

Because `kube-prometheus-stack` configures Grafana for Prometheus, a manual Prometheus data-source configuration is normally not required for this lab.

The data source can still be inspected from the Grafana UI to understand the integration.

## 15. Step 8 — Access Alertmanager

Alertmanager is also deployed as part of the monitoring stack.

### 15.1 Identify the Alertmanager Service

#### DO THIS

```bash
kubectl get svc -n monitoring
```

The commonly used service is:

```text
alertmanager-operated
```

Verify the actual service name before port forwarding.

### 15.2 Port-Forward Alertmanager

#### DO THIS

```bash
kubectl port-forward \
  -n monitoring \
  service/alertmanager-operated \
  9093:9093
```

#### EXPECT

Port `9093` is forwarded locally.

Open:

```text
http://localhost:9093
```

### 15.3 Verify Alertmanager

The Alertmanager interface allows us to inspect:

* Active alerts
* Silences
* Alert status
* Alert grouping
* Routing-related information

Actual notifications require properly configured Alertmanager receivers and routing rules.

## 16. Understanding the Custom Configuration

The monitoring stack uses:

```text
custom_kube_prometheus_stack.yml
```

The current lab configuration contains settings for Grafana and Alertmanager.

### 16.1 Grafana Administrator Password

```yaml
grafana:
  adminPassword: prom-operator
```

This configures the initial Grafana administrator password.

For a lab, this makes the login process predictable.

For production:

> Avoid storing administrator passwords directly in a values file committed to source control.

Use an appropriate secrets-management mechanism.

### 16.2 Alertmanager Configuration Selector

The configuration contains:

```yaml
alertmanager:
  alertmanagerSpec:
    alertmanagerConfigSelector:
      matchLabels:
        release: monitoring
```

This tells the Prometheus Operator to select `AlertmanagerConfig` resources matching:

```text
release: monitoring
```

Conceptually:

```text
Alertmanager
     │
     │ selects
     ▼
AlertmanagerConfig
     │
     │ label
     ▼
release: monitoring
```

The selector itself does not create the `AlertmanagerConfig`.

A matching resource must exist for the selector to have something to select.

### 16.3 Alertmanager Replicas

The configuration specifies:

```yaml
replicas: 2
```

This creates two Alertmanager replicas.

Conceptually:

```text
              Alertmanager
                   │
          ┌────────┴────────┐
          ▼                 ▼
      Replica 1          Replica 2
```

Running multiple replicas can improve availability.

However:

> High availability is more than simply increasing the replica count.

Production deployments should also consider:

* Alertmanager clustering
* Routing configuration
* Notification behavior
* Pod placement
* Resource requests and limits
* Persistence requirements
* Failure domains

### 16.4 Configuration Matching

The Prometheus Operator uses selectors to determine which Kubernetes monitoring resources belong to a particular Prometheus or Alertmanager instance.

This concept is important when working with:

```text
ServiceMonitor
PodMonitor
PrometheusRule
AlertmanagerConfig
```

A useful mental model is:

```text
Kubernetes Resources
        │
        ▼
Selectors
        │
        ▼
Prometheus Operator
        │
        ▼
Prometheus / Alertmanager
```

When monitoring resources are not discovered, selectors and labels should always be among the first things we verify.

## 17. Basic Prometheus Validation

After Prometheus is accessible, we should perform a few basic queries.

### 17.1 Check Target Availability

#### DO THIS

```promql
up
```

This returns the availability of discovered targets.

### 17.2 Check Number of Targets

A simple aggregation is:

```promql
count(up)
```

This gives the number of currently represented `up` time series.

### 17.3 Check Available Memory

A commonly available Node Exporter metric is:

```promql
node_memory_MemAvailable_bytes
```

This can be used to inspect available memory on monitored Linux nodes.

### 17.4 Calculate HTTP Request Rate

For applications exposing a counter such as:

```text
http_requests_total
```

we can calculate a five-minute request rate:

```promql
rate(http_requests_total[5m])
```

> The exact metric name depends on the application or exporter being monitored.

### 17.5 Explore Prometheus Targets

In the Prometheus UI, navigate to the targets page and verify:

```text
Target
  │
  ├── Endpoint
  ├── State
  ├── Labels
  └── Last Scrape
```

A healthy target should generally show:

```text
State = UP
```

## 18. Troubleshooting

This section provides a practical troubleshooting framework for common issues.

### 18.1 Problem — Pods Are Not Running

#### Check

```bash
kubectl get pods -n monitoring
```

Then inspect the affected pod:

```bash
kubectl describe pod <pod-name> -n monitoring
```

Check namespace events:

```bash
kubectl get events \
  -n monitoring \
  --sort-by=.lastTimestamp
```

Look for:

* Scheduling failures
* Insufficient CPU or memory
* Image-pull failures
* Volume problems
* Configuration errors
* Node availability problems

### 18.2 Problem — Pod Is in CrashLoopBackOff

#### Check Logs

```bash
kubectl logs <pod-name> -n monitoring
```

If the pod has multiple containers:

```bash
kubectl logs <pod-name> \
  -n monitoring \
  -c <container-name>
```

Also inspect:

```bash
kubectl describe pod <pod-name> -n monitoring
```

Look for:

* Configuration errors
* Failed health checks
* Permission problems
* Resource exhaustion
* Container startup failures

### 18.3 Problem — Pod Is in Pending State

#### Check

```bash
kubectl get pods -n monitoring
```

Then:

```bash
kubectl describe pod <pod-name> -n monitoring
```

Common causes include:

* Insufficient node CPU
* Insufficient node memory
* Missing PersistentVolume
* Node taints
* Scheduling constraints
* Availability of worker nodes

Check nodes:

```bash
kubectl get nodes
```

Check node resources:

```bash
kubectl describe nodes
```

### 18.4 Problem — Prometheus UI Is Not Accessible

First verify the services:

```bash
kubectl get svc -n monitoring
```

Then check Prometheus pods:

```bash
kubectl get pods -n monitoring
```

Verify the actual Prometheus service name.

For example:

```bash
kubectl port-forward \
  -n monitoring \
  service/prometheus-operated \
  9090:9090
```

Then access:

```text
http://localhost:9090
```

If the service name differs, use the actual service name returned by:

```bash
kubectl get svc -n monitoring
```

### 18.5 Problem — Grafana UI Is Not Accessible

Check the service:

```bash
kubectl get svc -n monitoring
```

Check the Grafana pod:

```bash
kubectl get pods -n monitoring | grep grafana
```

Then retry:

```bash
kubectl port-forward \
  -n monitoring \
  service/monitoring-grafana \
  8080:80
```

Access:

```text
http://localhost:8080
```

### 18.6 Problem — Grafana Login Does Not Work

First inspect the Secrets:

```bash
kubectl get secrets -n monitoring
```

Then retrieve the credentials from the appropriate Grafana Secret.

For example:

```bash
kubectl get secret \
  monitoring-grafana \
  -n monitoring \
  -o jsonpath='{.data.admin-user}' | base64 -d
```

```bash
kubectl get secret \
  monitoring-grafana \
  -n monitoring \
  -o jsonpath='{.data.admin-password}' | base64 -d
```

If the Secret name differs, use the actual Grafana Secret created by the Helm release.

### 18.7 Problem — Prometheus Has No Useful Targets

Check the Prometheus Targets page.

Then inspect Kubernetes monitoring resources:

```bash
kubectl get servicemonitors -A
```

```bash
kubectl get podmonitors -A
```

```bash
kubectl get prometheusrules -A
```

Also check the Prometheus resource:

```bash
kubectl get prometheus -A
```

Common causes include:

* Incorrect labels
* Incorrect selectors
* Wrong service port
* Incorrect metrics path
* Application does not expose `/metrics`
* Prometheus selector configuration
* ServiceMonitor/PodMonitor not being selected

### 18.8 Problem — ServiceMonitor Is Not Being Discovered

First inspect the ServiceMonitor:

```bash
kubectl get servicemonitor <name> -n <namespace> -o yaml
```

Check the selector:

```yaml
selector:
  matchLabels:
    app: example-app
```

Then compare it with the Service:

```bash
kubectl get svc <service-name> \
  -n <namespace> \
  -o yaml
```

The labels must match the selector.

Also verify the endpoint:

```yaml
endpoints:
  - port: http
    path: /metrics
```

The `port` value must correspond to the named Service port.

### 18.9 Problem — Helm Installation Fails

Check the Helm release:

```bash
helm list -n monitoring
```

Inspect the release:

```bash
helm status monitoring -n monitoring
```

Check Kubernetes resources:

```bash
kubectl get all -n monitoring
```

Render the chart before installation:

```bash
helm template monitoring \
  prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f ./custom_kube_prometheus_stack.yml
```

This helps identify:

* Invalid values
* YAML errors
* Template issues
* Configuration mismatches

### 18.10 Problem — Helm Repository Information Is Stale

Run:

```bash
helm repo update
```

Then:

```bash
helm search repo prometheus-community/kube-prometheus-stack
```

If necessary, inspect available versions:

```bash
helm search repo prometheus-community/kube-prometheus-stack --versions
```

## 19. Cleanup

This lab creates AWS resources that may incur charges.

Always clean up resources when the lab is complete.

### 19.1 Uninstall the Helm Release

#### DO THIS

```bash
helm uninstall monitoring \
  --namespace monitoring
```

#### VERIFY

```bash
helm list -n monitoring
```

The `monitoring` release should no longer appear.

### 19.2 Delete the Monitoring Namespace

#### DO THIS

```bash
kubectl delete namespace monitoring
```

#### VERIFY

```bash
kubectl get namespaces
```

The namespace should eventually disappear.

### 19.3 Delete the EKS Cluster

If the cluster is no longer required:

#### DO THIS

```bash
eksctl delete cluster \
  --name observability \
  --region us-east-1
```

#### VERIFY

```bash
eksctl get cluster --region us-east-1
```

Confirm that the `observability` cluster has been removed.

> **Important:** Review AWS resources after deletion if resources were created outside the lifecycle managed by `eksctl`.

### 19.4 AWS Resource Cleanup Checklist

Before considering the lab complete, verify that unnecessary resources have been removed.

Check for:

```text
☐ EKS cluster
☐ EKS managed node group
☐ EC2 instances
☐ Load Balancers
☐ EBS volumes
☐ NAT Gateways
☐ Elastic IPs
☐ Unused IAM resources
☐ Other lab-created AWS resources
```

This is important because some AWS resources can continue generating charges even after the Kubernetes cluster has been deleted.

## 20. What We Implemented

In this lab, we built a Kubernetes monitoring environment using AWS EKS and the Prometheus ecosystem.

The overall implementation was:

```text
                    AWS
                     │
                     ▼
                EKS Cluster
                     │
                     ▼
              Worker Node Group
                     │
                     ▼
          monitoring namespace
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
     Prometheus    Grafana   Alertmanager
          │          │          │
          │          │          │
          └──────────┼──────────┘
                     │
                     ▼
              Kubernetes Metrics
```

### Execution Flow

```text
1. Create EKS cluster
        │
        ▼
2. Configure kubectl
        │
        ▼
3. Add Prometheus Helm repository
        │
        ▼
4. Create monitoring namespace
        │
        ▼
5. Configure Helm values
        │
        ▼
6. Install kube-prometheus-stack
        │
        ▼
7. Verify Kubernetes resources
        │
        ▼
8. Access Prometheus
        │
        ▼
9. Access Grafana
        │
        ▼
10. Access Alertmanager
        │
        ▼
11. Run basic PromQL validation
        │
        ▼
12. Clean up resources
```

## 21. Key Takeaways

### Metrics

> Metrics are numerical measurements describing system behavior over time.

Examples:

```text
CPU       = 70%
Memory    = 60%
Latency   = 200 ms
Requests  = 1,000/sec
```

### Monitoring

> Monitoring uses measurements and other operational signals to continuously assess system health and detect abnormal conditions.

### Prometheus

> Prometheus is an open-source monitoring and alerting toolkit designed primarily for collecting, storing, querying, and alerting on time-series metrics.

Its core workflow can be remembered as:

```text
Scrape
  │
  ▼
Store
  │
  ▼
Query
  │
  ▼
Alert
```

### Prometheus Pull Model

Prometheus generally retrieves metrics from targets rather than requiring every target to push metrics.

```text
Prometheus
     │
     │ Scrape
     ▼
Target
     │
     ▼
Metrics
```

### Service Discovery

Service discovery is particularly important in Kubernetes because workloads are dynamic.

```text
Pods change
    │
    ▼
Targets change
    │
    ▼
Service Discovery
    │
    ▼
Prometheus
```

### Exporters

Exporters expose metrics from systems that do not directly expose Prometheus-compatible metrics.

```text
System
   │
   ▼
Exporter
   │
   ▼
/metrics
   │
   ▼
Prometheus
```

### Alertmanager

Prometheus evaluates alert rules, while Alertmanager manages the resulting alerts.

```text
Metrics
   │
   ▼
Prometheus
   │
   ▼
Alert Rule
   │
   ▼
Alertmanager
   │
   ▼
Notification
```

### Grafana

Grafana provides visualization and dashboards for metrics collected by systems such as Prometheus.

```text
Prometheus
    │
    ▼
Grafana
    │
    ▼
Dashboard
```

### Kubernetes Monitoring

Kubernetes monitoring can cover multiple layers:

```text
Cluster
   │
   ├── Nodes
   │
   ├── Pods
   │
   ├── Containers
   │
   ├── Services
   │
   └── Applications
```

Because Kubernetes workloads are dynamic and distributed, automated discovery and centralized monitoring are essential.

## 22. Interview Questions and Answers

### Q1. What is a metric?

**Answer:**

A metric is a numerical measurement that describes the state or behavior of a system over time.

Examples include CPU usage, memory usage, request rate, latency, and error count.

### Q2. What is monitoring?

**Answer:**

Monitoring is the continuous process of collecting and evaluating system measurements to understand system health, detect abnormal conditions, and generate alerts when required.

### Q3. What is Prometheus?

**Answer:**

Prometheus is an open-source monitoring and alerting toolkit designed primarily for collecting, storing, querying, and alerting on time-series metrics.

### Q4. Why is Prometheus popular in Kubernetes?

**Answer:**

Prometheus is well suited to Kubernetes because Kubernetes environments are dynamic. Pods and services are continuously created, deleted, rescheduled, and scaled.

Prometheus supports Kubernetes service discovery and integrates well with Kubernetes-native monitoring resources through the Prometheus Operator.

### Q5. What is the Prometheus pull model?

**Answer:**

In the pull model, Prometheus periodically sends HTTP requests to monitoring targets and retrieves their metrics, commonly from a `/metrics` endpoint.

```text
Prometheus
    │
    │ GET /metrics
    ▼
Target
```

### Q6. Why does Prometheus use a pull model?

**Answer:**

The pull model allows Prometheus to control the scrape interval and provides visibility into target availability.

For example, if a target cannot be scraped, Prometheus can detect that condition.

### Q7. What is service discovery?

**Answer:**

Service discovery is the mechanism used to dynamically identify monitoring targets.

In Kubernetes, Prometheus can use the Kubernetes API to discover pods, services, nodes, and other resources.

### Q8. What is Pushgateway?

**Answer:**

Pushgateway is a component that allows short-lived jobs to expose metrics that Prometheus can later scrape.

It is intended for specific batch or short-lived job scenarios and is not a general replacement for Prometheus's pull model.

### Q9. What is an exporter?

**Answer:**

An exporter exposes metrics from a system or application in a format that Prometheus can scrape.

For example, Node Exporter exposes Linux host metrics.

### Q10. What is Node Exporter?

**Answer:**

Node Exporter exposes hardware and operating-system-level metrics from Linux hosts, such as CPU, memory, filesystem, and network metrics.

### Q11. What is kube-state-metrics?

**Answer:**

kube-state-metrics exposes metrics about the state of Kubernetes objects.

For example, it can expose information about:

* Deployments
* Pods
* StatefulSets
* DaemonSets
* Nodes
* Jobs

It is important to distinguish kube-state-metrics from Node Exporter:

```text
Node Exporter
    │
    ▼
Host-level metrics

kube-state-metrics
    │
    ▼
Kubernetes object-state metrics
```

### Q12. What is PromQL?

**Answer:**

PromQL is Prometheus Query Language.

It is used to select, filter, aggregate, and analyze time-series metrics.

Example:

```promql
up
```

Another example:

```promql
rate(http_requests_total[5m])
```

### Q13. What is Alertmanager?

**Answer:**

Alertmanager receives alerts generated by Prometheus and handles alert management such as grouping, deduplication, silencing, inhibition, routing, and notifications.

### Q14. What is the difference between Prometheus and Alertmanager?

**Answer:**

Prometheus primarily:

```text
Collects
Stores
Queries
Evaluates alert rules
```

Alertmanager primarily:

```text
Groups
Deduplicates
Silences
Routes
Notifies
```

### Q15. What is Grafana?

**Answer:**

Grafana is a visualization and dashboarding platform.

It can use Prometheus as a data source to create dashboards, panels, graphs, and interactive visualizations.

### Q16. What is kube-prometheus-stack?

**Answer:**

`kube-prometheus-stack` is a Helm chart that provides a Kubernetes monitoring stack commonly containing Prometheus, Alertmanager, Grafana, Prometheus Operator, Node Exporter, kube-state-metrics, dashboards, and monitoring rules.

The exact resources depend on the chart version and configuration.

### Q17. What is Prometheus Operator?

**Answer:**

Prometheus Operator provides Kubernetes-native management of Prometheus and related monitoring resources.

It uses Kubernetes custom resources such as:

```text
Prometheus
ServiceMonitor
PodMonitor
PrometheusRule
Alertmanager
AlertmanagerConfig
```

### Q18. What is a ServiceMonitor?

**Answer:**

A `ServiceMonitor` is a Kubernetes custom resource used by the Prometheus Operator to define how services should be discovered and scraped.

### Q19. What happens when a Kubernetes pod is deleted?

**Answer:**

If Prometheus is using Kubernetes service discovery, the deleted pod is removed from the set of discovered targets when Kubernetes reports the change.

A replacement pod can then be discovered automatically.

This is one of the major advantages of dynamic service discovery.

### Q20. What does `up` mean in Prometheus?

**Answer:**

The `up` metric indicates whether a target was successfully scraped.

Conceptually:

```text
up = 1 → scrape succeeded
up = 0 → scrape failed
```

### Q21. Where does Prometheus store metrics?

**Answer:**

Prometheus stores metrics in its local time-series database on disk.

For long-term or multi-cluster storage requirements, additional systems such as Thanos or Grafana Mimir can be considered.

### Q22. Why might a Prometheus target show DOWN?

**Answer:**

Possible causes include:

* Target is unavailable.
* Network connectivity problem.
* Incorrect endpoint.
* Incorrect port.
* Incorrect metrics path.
* TLS problem.
* Authentication problem.
* ServiceMonitor selector mismatch.
* Application is not exposing metrics.

A practical troubleshooting flow is:

```text
Target DOWN
    │
    ▼
Check Target URL
    │
    ▼
Check Service
    │
    ▼
Check Pod
    │
    ▼
Check /metrics
    │
    ▼
Check ServiceMonitor
    │
    ▼
Check Prometheus configuration
```

### Q23. Why should metric labels be designed carefully?

**Answer:**

Prometheus creates separate time series for different label combinations.

If labels contain highly dynamic or unbounded values, such as unique request IDs, user IDs, or random identifiers, the number of time series can grow rapidly.

This is called **high cardinality** and can increase memory and storage usage.

### Q24. What is the difference between Node Exporter and kube-state-metrics?

**Answer:**

Node Exporter focuses on operating-system and host-level metrics.

kube-state-metrics focuses on the state of Kubernetes API objects.

```text
Node Exporter
     │
     ▼
Linux Host Metrics

kube-state-metrics
     │
     ▼
Kubernetes Object State
```

### Q25. Why use Helm for Prometheus installation?

**Answer:**

Helm simplifies the installation and management of complex Kubernetes applications.

Instead of manually creating many Kubernetes resources, we can use a Helm chart and values file to deploy and configure the monitoring stack consistently.

## 23. Final Mental Model

The complete Prometheus monitoring workflow can be remembered as:

```text
                    Kubernetes
                        │
                        ▼
                 Metrics Sources
                        │
                        ▼
                Service Discovery
                        │
                        ▼
                   Prometheus
                        │
               ┌────────┴────────┐
               │                 │
               ▼                 ▼
            PromQL          Alert Rules
               │                 │
               ▼                 ▼
            Grafana         Alertmanager
               │                 │
               ▼                 ▼
           Dashboards       Notifications
```

### End-to-End Flow

```text
1. Kubernetes workloads generate metrics
                 │
                 ▼
2. Prometheus discovers targets
                 │
                 ▼
3. Prometheus scrapes /metrics
                 │
                 ▼
4. Metrics are stored as time series
                 │
                 ▼
5. PromQL queries the metrics
                 │
          ┌──────┴──────┐
          ▼             ▼
       Grafana     Alert Rules
          │             │
          ▼             ▼
      Dashboards   Alertmanager
                        │
                        ▼
                   Notifications
```

### In One Sentence

> Prometheus collects and stores time-series metrics, PromQL helps us query and analyze those metrics, Grafana helps us visualize them, and Alertmanager manages alerts generated from Prometheus alerting rules.

### Completion Checklist

Before considering this section complete, verify:

```text
☐ EKS cluster created
☐ Worker nodes are Ready
☐ kubectl is configured
☐ Prometheus Community Helm repository added
☐ Monitoring namespace created
☐ kube-prometheus-stack installed
☐ Prometheus pod is running
☐ Grafana pod is running
☐ Alertmanager pod is running
☐ Monitoring services verified
☐ Prometheus UI accessed
☐ Grafana UI accessed
☐ Alertmanager UI accessed
☐ PromQL `up` query executed
☐ Prometheus targets inspected
☐ Basic troubleshooting commands practiced
☐ Lab resources cleaned up
```

### Final Summary

At this stage, we have established the foundation for Kubernetes monitoring using Prometheus.

The key architecture to remember is:

```text
             Kubernetes
                  │
                  ▼
          Service Discovery
                  │
                  ▼
             Prometheus
                  │
          ┌───────┴────────┐
          │                │
          ▼                ▼
       PromQL         Alert Rules
          │                │
          ▼                ▼
       Grafana        Alertmanager
          │                │
          ▼                ▼
      Dashboards      Notifications
```

The next practical sections can build on this foundation by covering:

* PromQL in detail
* Kubernetes resource metrics
* Node and container monitoring
* Grafana dashboards
* ServiceMonitor and PodMonitor
* PrometheusRule
* Alerting
* Alertmanager routing
* Application metrics
* Recording rules
* Metric cardinality
* Production monitoring practices
