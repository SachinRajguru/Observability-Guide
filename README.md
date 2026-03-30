# Observability Guide
Structured observability guide for developers, DevOps, SREs, and infrastructure engineers covering metrics, logs, and traces using Prometheus, Grafana, Elasticsearch, Fluent Bit, Kibana, Jaeger, Groundcover (eBPF), and OpenTelemetry, with practical Kubernetes-based implementations.

## Overview of Each Day

**Day 1: Introduction to Observability**  
**Concepts Covered:**  
- Introduction to observability, monitoring, logging, and tracing  
- Differences between monitoring and observability  
- Tools available for monitoring and observability  
- Comparison of monitoring and observability in bare-metal servers vs. Kubernetes  

**Key Learning:**  
- Understand the fundamental concepts of observability  
- Learn why monitoring and observability are crucial in modern IT environments  

**Day 2: Prometheus - Setting Up Monitoring**  
**Concepts Covered:**  
- Introduction to Prometheus and its architecture  
- Setup and configuration of Prometheus in an EKS cluster  
- Installation of kube-prometheus-stack with Helm and integration with Grafana  
- Basic queries and setup for monitoring with Prometheus and Grafana  

**Key Learning:**  
- Gain hands-on experience with Prometheus and Grafana  
- Learn to install and configure Prometheus on Kubernetes  

**Day 3: Metrics and PromQL in Prometheus**  
**Concepts Covered:**  
- Introduction to PromQL and basic querying techniques  
- Aggregation and functions in PromQL to analyze metrics data  

**Key Learning:**  
- Master the Prometheus Query Language (PromQL) for querying and analyzing metrics  

**Day 4: Instrumentation and Custom Metrics**  
**Concepts Covered:**  
- Instrumentation for adding monitoring capabilities to applications  
- Understanding different types of metrics in Prometheus: Counter, Gauge, Histogram, and Summary  
- Writing custom metrics in a Node.js application using the prom-client library  
- Dockerizing the application and deploying it on Kubernetes  
- Setting up Alertmanager for alerting based on custom metrics  

**Key Learning:**  
- Learn how to instrument applications to expose custom metrics  
- Configure alerts in Alertmanager to monitor application performance  
- Understand how to work with different types of metrics in Prometheus  

**Day 5: Logging with EFK Stack**  
**Concepts Covered:**  
- Introduction to logging in distributed systems and Kubernetes  
- Setting up the EFK stack (Elasticsearch, Fluent Bit, Kibana) on Kubernetes  
- Detailed setup and configuration for collecting and visualizing logs  
- Cleaning up Kubernetes cluster and resources  

**Key Learning:**  
- Understand the importance of logging and how to set it up in Kubernetes  

**Day 6: Distributed Tracing with Jaeger**  
**Concepts Covered:**  
- Introduction to Jaeger and its architecture for distributed tracing  
- Setting up Jaeger in a Kubernetes cluster using Helm  
- Instrumenting services using OpenTelemetry to enable tracing  
- Viewing and analyzing traces in the Jaeger UI  
- Cleaning up the environment after setting up Jaeger  

**Key Learning:**  
- Gain insights into distributed tracing and how it helps with debugging and performance optimization  
- Learn how to set up and configure Jaeger for tracing in a microservices architecture  

**Day 7: OpenTelemetry – Setting Up Unified Observability**  
**Concepts Covered:**  
- Introduction to OpenTelemetry, a unified framework for observability  
- Understanding how OpenTelemetry integrates tracing, metrics, and logs  
- Comparison of OpenTelemetry with prior observability tools like Jaeger and Prometheus  
- Supported programming languages and multi-language support in OpenTelemetry  
- Step-by-step setup of OpenTelemetry in Kubernetes  

**Key Learning:**  
- Learn how OpenTelemetry simplifies collecting and exporting telemetry data  
- Understand the benefits of a unified observability approach using OpenTelemetry  
- Gain hands-on experience setting up OpenTelemetry Collector, Prometheus, Jaeger, and Elasticsearch to monitor a Golang microservice application