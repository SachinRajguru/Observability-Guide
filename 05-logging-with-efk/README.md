
## Logging with EFK

> **File:** `README.md`

Structured logging guide for developers, DevOps, SRE, and infrastructure engineers covering centralized Kubernetes logging with **Elasticsearch, Fluent Bit, and Kibana (EFK)**.

This topic builds on the metrics and monitoring work completed in the previous observability topics and introduces the **logging pillar of observability**.

## Table of Contents

1. [Explore Logging in Kubernetes](#1-explore-logging-in-kubernetes)
2. [Learning Objectives](#2-learning-objectives)
3. [EFK Architecture](#3-efk-architecture)
   * [Components](#components)
4. [Project Structure](#4-project-structure)
5. [Documentation](#5-documentation)
   * [Complete Execution Guide](#complete-execution-guide)
6. [Technology Stack](#6-technology-stack)
7. [Logging Flow](#7-logging-flow)
8. [What We Will Validate](#8-what-we-will-validate)
9. [Cleanup](#9-cleanup)
10. [Official Documentation](#10-official-documentation)
11. [Continue Exploring](#11-continue-exploring)

## 1. Explore Logging in Kubernetes

In a distributed application environment, metrics help us understand **what is happening**, while logs provide detailed information about **what happened and why an event occurred**.

When applications are distributed across multiple Kubernetes namespaces, pods, and nodes, checking logs individually with `kubectl logs` becomes difficult.

A centralized logging architecture solves this problem by collecting application and infrastructure logs into a common platform where we can search, filter, and investigate them.

## 2. Learning Objectives

By completing this topic, we will learn how to:

* Understand logging as an observability pillar
* Understand the EFK architecture
* Understand Elasticsearch
* Understand Fluent Bit
* Understand Kibana
* Understand Kubernetes container logging
* Deploy a centralized logging stack
* Run Fluent Bit as a DaemonSet
* Collect container logs from Kubernetes nodes
* Enrich logs with Kubernetes metadata
* Filter unwanted namespaces
* Forward logs to Elasticsearch
* Store Elasticsearch data on persistent storage
* Access Kibana
* Create a Kibana data view
* Search and filter application logs
* Troubleshoot the logging pipeline
* Clean up the logging infrastructure

## 3. EFK Architecture

![Architecture](./images/architecture.png)

A simplified architecture is:

```text
                   Kubernetes Cluster
                           │
             ┌─────────────┴─────────────┐
             │                           │
       Worker Node 1               Worker Node 2
             │                           │
     Application Pods            Application Pods
             │                           │
             ▼                           ▼
       Container Logs              Container Logs
             │                           │
             └─────────────┬─────────────┘
                           │
                           ▼
                       Fluent Bit
                       DaemonSet
                           │
                           │ Forward logs
                           ▼
                     Elasticsearch
                 Persistent Storage
                           │
                           │ Query / Search
                           ▼
                         Kibana
                     Web Interface
```

### Components

| Component     | Responsibility                                            |
| ------------- | --------------------------------------------------------- |
| Elasticsearch | Stores, indexes, and searches log data                    |
| Fluent Bit    | Collects and forwards Kubernetes logs                     |
| Kibana        | Provides a web interface for searching and analyzing logs |

## 4. Project Structure

```text
05-logging-with-efk/
├── README.md
├── 01-logging-with-efk.md
├── helm-values/
│   └── fluentbit-values.yaml
└── images/
    └── architecture.png
```

## 5. Documentation

### Complete Execution Guide

See:

`01-logging-with-efk.md`

The execution guide covers:

* prerequisites
* Kubernetes logging architecture
* EBS CSI storage preparation
* Elasticsearch deployment
* Kibana deployment
* Fluent Bit configuration
* log collection
* Kubernetes metadata enrichment
* filtering
* Kibana data views
* application-log validation
* troubleshooting
* cleanup

## 6. Technology Stack

* Kubernetes
* Amazon EKS
* Helm
* AWS EBS CSI Driver
* Amazon EBS
* Elasticsearch
* Fluent Bit
* Kibana

## 7. Logging Flow

```text
Application
    │
    ▼
Container stdout/stderr
    │
    ▼
Kubernetes node log files
    │
    ▼
Fluent Bit
    │
    ├── Parse logs
    ├── Add Kubernetes metadata
    ├── Apply filters
    │
    ▼
Elasticsearch
    │
    ▼
Kibana
    │
    ▼
Search / Filter / Investigate
```

## 8. What We Will Validate

After deployment, we will verify:

1. Elasticsearch is running.
2. Elasticsearch has persistent storage.
3. Kibana is running.
4. Fluent Bit is running on every Kubernetes node.
5. Fluent Bit can read container logs.
6. Fluent Bit can enrich logs with Kubernetes metadata.
7. Fluent Bit can forward logs to Elasticsearch.
8. Application logs appear in Elasticsearch.
9. Kibana can query the stored logs.
10. We can filter logs by namespace, pod, container, and message.

## 9. Cleanup

The execution guide contains the complete cleanup procedure.

Before deleting infrastructure, verify which resources belong to this topic and avoid deleting shared observability components that are used by other projects.

## 10. Official Documentation

* Kubernetes logging
* Helm
* Fluent Bit
* Elasticsearch
* Kibana
* Amazon EBS CSI Driver
* Elastic Cloud on Kubernetes

See the official documentation links in `01-logging-with-efk.md`.

## 11. Continue Exploring

The previous topic introduced application instrumentation, metrics, alerting, and tracing.

This topic extends the observability platform with centralized logging.

```text
Metrics
   │
   ▼
Prometheus / Grafana
   │
   ▼
Logs
   │
   ▼
Elasticsearch / Fluent Bit / Kibana
   │
   ▼
Traces
   │
   ▼
OpenTelemetry / Jaeger
```
