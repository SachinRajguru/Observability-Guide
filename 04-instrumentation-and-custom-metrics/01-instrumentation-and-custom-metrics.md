
## Instrumentation and Custom Metrics — Complete Execution Guide

> **File:** `01-instrumentation-and-custom-metrics.md`

> A beginner-friendly, end-to-end execution guide for running, testing, containerizing, deploying, observing, troubleshooting, and cleaning up the **Instrumentation and Custom Metrics** lab.

## Table of Contents

- [1. Purpose](#1-purpose)
- [2. Architecture](#2-architecture)
- [3. Before You Start](#3-before-you-start)
- [4. Prerequisites](#4-prerequisites)
  - [4.1 Node.js and npm](#41-nodejs-and-npm)
  - [4.2 Git](#42-git)
  - [4.3 curl](#43-curl)
  - [4.4 Docker](#44-docker)
  - [4.5 Kubernetes CLI](#45-kubernetes-cli)
  - [4.6 Kustomize](#46-kustomize)
- [5. Required Existing Observability Infrastructure](#5-required-existing-observability-infrastructure)
- [6. Navigate to the Lab](#6-navigate-to-the-lab)
- [7. Stage 1 — Run the Applications Locally](#7-stage-1--run-the-applications-locally)
- [8. Install Service B Dependencies](#8-install-service-b-dependencies)
- [9. Start Service B](#9-start-service-b)
- [10. Test Service B](#10-test-service-b)
- [11. Install Service A Dependencies](#11-install-service-a-dependencies)
- [12. Start Service A](#12-start-service-a)
- [13. Test Service A](#13-test-service-a)
- [14. Test the Example Endpoint](#14-test-the-example-endpoint)
- [15. Test Service A → Service B](#15-test-service-a--service-b)
- [16. Test the Metrics Endpoint](#16-test-the-metrics-endpoint)
- [17. Verify That Requests Are Counted Correctly](#17-verify-that-requests-are-counted-correctly)
- [18. Verify Active Requests](#18-verify-active-requests)
- [19. Verify Histogram Metrics](#19-verify-histogram-metrics)
- [20. Generate Histogram Data](#20-generate-histogram-data)
- [21. Verify Summary Metrics](#21-verify-summary-metrics)
- [22. Test Error Endpoints](#22-test-error-endpoints)
- [23. Test Logging](#23-test-logging)
- [24. Local Testing Complete](#24-local-testing-complete)
- [25. Stop the Local Applications Before Docker](#25-stop-the-local-applications-before-docker)
- [26. Stage 2 — Build Docker Images](#26-stage-2--build-docker-images)
- [27. Build Service A Image](#27-build-service-a-image)
- [28. Build Service B Image](#28-build-service-b-image)
- [29. Inspect the Docker Images](#29-inspect-the-docker-images)
- [30. Run Service B as a Container](#30-run-service-b-as-a-container)
- [31. Run Service A as a Container](#31-run-service-a-as-a-container)
- [32. Test the Dockerized Applications](#32-test-the-dockerized-applications)
- [33. Stop Docker Containers](#33-stop-docker-containers)
- [34. Optional Docker Network Cleanup](#34-optional-docker-network-cleanup)
- [35. Stage 3 — Push Images to Docker Hub](#35-stage-3--push-images-to-docker-hub)
- [36. Push Service A](#36-push-service-a)
- [37. Push Service B](#37-push-service-b)
- [38. Verify the Images](#38-verify-the-images)
- [39. Stage 4 — Deploy to Kubernetes](#39-stage-4--deploy-to-kubernetes)
- [40. Create the `dev` Namespace](#40-create-the-dev-namespace)
- [41. Understand the Kubernetes Services](#41-understand-the-kubernetes-services)
- [42. Deploy the Applications](#42-deploy-the-applications)
- [43. Check the Pods](#43-check-the-pods)
- [44. Check the Deployments](#44-check-the-deployments)
- [45. Check the Services](#45-check-the-services)
- [46. Check Service A's LoadBalancer](#46-check-service-as-loadbalancer)
- [47. Test Service A Through Kubernetes](#47-test-service-a-through-kubernetes)
- [48. Understand Kubernetes DNS](#48-understand-kubernetes-dns)
- [49. Verify Service B Internally](#49-verify-service-b-internally)
- [50. Stage 5 — Configure Prometheus Monitoring](#50-stage-5--configure-prometheus-monitoring)
- [51. Apply the Observability Resources](#51-apply-the-observability-resources)
- [52. Verify the ServiceMonitor](#52-verify-the-servicemonitor)
- [53. Verify Prometheus Rules](#53-verify-prometheus-rules)
- [54. Verify Alertmanager Configuration](#54-verify-alertmanager-configuration)
- [55. IMPORTANT — Do Not Commit Email Credentials](#55-important--do-not-commit-email-credentials)
- [56. Validate Alertmanager Configuration Before Applying](#56-validate-alertmanager-configuration-before-applying)
- [57. Stage 6 — Verify Prometheus Metrics](#57-stage-6--verify-prometheus-metrics)
- [58. Generate Normal Traffic](#58-generate-normal-traffic)
- [59. Use the Traffic-Generation Script](#59-use-the-traffic-generation-script)
- [60. Make `test.sh` Executable](#60-make-testsh-executable)
- [61. Understand What the Traffic Script Generates](#61-understand-what-the-traffic-script-generates)
- [62. Stage 7 — Distributed Tracing](#62-stage-7--distributed-tracing)
- [63. Understand the Trace Flow](#63-understand-the-trace-flow)
- [64. Generate a Trace Manually](#64-generate-a-trace-manually)
- [65. Expected Distributed Trace](#65-expected-distributed-trace)
- [66. Stage 8 — Test the Pod Restart Alert](#66-stage-8--test-the-pod-restart-alert)
- [67. Trigger the Crash](#67-trigger-the-crash)
- [68. Inspect the Service A Pod](#68-inspect-the-service-a-pod)
- [69. Important Alerting Note](#69-important-alerting-note)
- [70. Testing Repeated Restarts](#70-testing-repeated-restarts)
- [71. Stage 9 — Troubleshooting](#71-stage-9--troubleshooting)
- [71.1 Service A Does Not Start Locally](#711-service-a-does-not-start-locally)
- [72. Service B Does Not Start](#72-service-b-does-not-start)
- [73. Port 3001 Is Already in Use](#73-port-3001-is-already-in-use)
- [74. Port 3002 Is Already in Use](#74-port-3002-is-already-in-use)
- [75. Service A Cannot Reach Service B Locally](#75-service-a-cannot-reach-service-b-locally)
- [76. Pod Is Not Starting](#76-pod-is-not-starting)
- [77. ImagePullBackOff](#77-imagepullbackoff)
- [78. `/metrics` Does Not Work in Kubernetes](#78-metrics-does-not-work-in-kubernetes)
- [79. Prometheus Does Not Show Service A Metrics](#79-prometheus-does-not-show-service-a-metrics)
- [80. Service A Cannot Reach Service B in Kubernetes](#80-service-a-cannot-reach-service-b-in-kubernetes)
- [81. Traces Are Missing](#81-traces-are-missing)
- [82. Check Jaeger Connectivity](#82-check-jaeger-connectivity)
- [83. Stage 10 — Complete Cleanup](#83-stage-10--complete-cleanup)
- [84. Stop Local Node.js Applications](#84-stop-local-nodejs-applications)
- [85. Stop and Remove Docker Containers](#85-stop-and-remove-docker-containers)
- [86. Remove the Docker Network](#86-remove-the-docker-network)
- [87. Clean Up Kubernetes Application Resources](#87-clean-up-kubernetes-application-resources)
- [88. Clean Up Monitoring Configuration](#88-clean-up-monitoring-configuration)
- [89. Delete the Development Namespace](#89-delete-the-development-namespace)
- [90. Important: Do Not Delete the Monitoring Namespace](#90-important-do-not-delete-the-monitoring-namespace)
- [91. Optional — Remove Docker Images](#91-optional--remove-docker-images)
- [92. Optional — Remove `node_modules`](#92-optional--remove-node_modules)
- [93. Never Delete These During Normal Cleanup](#93-never-delete-these-during-normal-cleanup)
- [94. Final Cleanup Verification](#94-final-cleanup-verification)
- [95. Complete Execution Checklist](#95-complete-execution-checklist)
  - [Prerequisites](#prerequisites)
  - [Local Application](#local-application)
  - [Docker](#docker)
  - [Docker Hub](#docker-hub)
  - [Kubernetes](#kubernetes)
  - [Prometheus](#prometheus)
  - [Alertmanager](#alertmanager)
  - [Tracing](#tracing)
  - [Traffic](#traffic)
  - [Alert Testing](#alert-testing)
  - [Cleanup](#cleanup)
- [96. Quick Start — After the First Successful Setup](#96-quick-start--after-the-first-successful-setup)
- [97. Final Architecture Summary](#97-final-architecture-summary)

## 1. Purpose

This lab demonstrates application observability using two Node.js services:

* **Service A** — the primary application that exposes custom Prometheus metrics, logs, and distributed traces.
* **Service B** — the downstream application called by Service A and used to demonstrate distributed tracing.

The applications are:

1. Run locally.
2. Containerized with Docker.
3. Published as versioned Docker images.
4. Deployed to Kubernetes.
5. Scraped by Prometheus.
6. Monitored through a Kubernetes `ServiceMonitor`.
7. Evaluated using Prometheus alerting rules.
8. Connected to Alertmanager.
9. Traced using OpenTelemetry and Jaeger.
10. Tested using automated traffic generation.

The project structure is:

```text
04-instrumentation-and-custom-metrics/
├── application/
│   ├── service-a/
│   │   ├── .dockerignore
│   │   ├── Dockerfile
│   │   ├── index.js
│   │   ├── metrics_instrumentation_analysis.md
│   │   ├── package.json
│   │   └── tracing.js
│   │
│   └── service-b/
│       ├── .dockerignore
│       ├── Dockerfile
│       ├── index.js
│       ├── metrics_instrumentation_analysis.md
│       ├── package.json
│       └── tracing.js
│
├── kubernetes-manifest/
│   ├── deployment-svc-a.yml
│   ├── deployment-svc-b.yml
│   ├── kustomization.yml
│   ├── service-svc-a.yml
│   └── service-svc-b.yml
│
├── alerts-alertmanager-servicemonitor-manifest/
│   ├── alertmanagerconfig.yml
│   ├── alerts.yml
│   ├── email-secret.example.yml
│   ├── kustomization.yml
│   └── serviceMonitor.yml
│
├── test.sh
└── README.md
```

## 2. Architecture

The overall Kubernetes architecture is:

```text
                         External Client
                               |
                               v
                    +----------------------+
                    | Kubernetes Service   |
                    |      a-service       |
                    |     LoadBalancer     |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |      Service A       |
                    |    Node.js/Express   |
                    |       Port 3001      |
                    +----+------------+----+
                         |            |
                         |            |
                  HTTP   |            | /metrics
                         |            |
                         v            v
                +-----------------+  +----------------+
                |   Service B     |  |   Prometheus   |
                | Node.js/Express |  |    scraping    |
                |   Port 3002     |  +-------+--------+
                +-------+---------+          |
                        |                    |
                        | OTLP               | alerts
                        v                    v
                +---------------+    +----------------+
                |    Jaeger     |    |  Alertmanager  |
                |   Trace UI    |    +-------+---------+
                +---------------+            |
                                             v
                                           Email
```

Application logs can additionally flow through an EFK-style logging architecture:

```text
Service A / Service B
        |
        v
   Fluent Bit
        |
        v
 Elasticsearch
        |
        v
     Kibana
```

The project therefore demonstrates the three major observability signals:

```text
Metrics → What is happening?

Logs → What happened?

Traces → Where did the request travel?
```

## 3. Before You Start

This guide contains several stages.

Do **not** try to execute every command at once.

Follow the stages in order:

```text
Stage 1  → Prerequisites
Stage 2  → Local application
Stage 3  → Metrics
Stage 4  → Docker
Stage 5  → Docker Hub
Stage 6  → Kubernetes
Stage 7  → Prometheus / ServiceMonitor
Stage 8  → Alertmanager
Stage 9  → Traffic generation
Stage 10 → Distributed tracing
Stage 11 → Alert testing
Stage 12 → Troubleshooting
Stage 13 → Cleanup
```

The most important rule for beginners is:

> Do not proceed to the next stage until the current stage works.

## 4. Prerequisites

You need the following tools available.

### 4.1 Node.js and npm

Check Node.js:

```bash
node --version
```

Check npm:

```bash
npm --version
```

The current local application testing environment used Node.js:

```text
v22.15.0
```

The Dockerfiles use the Node.js 24 Alpine image for the container runtime.

### 4.2 Git

```bash
git --version
```

### 4.3 curl

```bash
curl --version
```

Git Bash on Windows normally provides `curl`.

### 4.4 Docker

```bash
docker --version
```

Verify Docker is actually running:

```bash
docker info
```

If `docker info` fails, start Docker Desktop before continuing.

### 4.5 Kubernetes CLI

Check:

```bash
kubectl version --client
```

You also need access to a Kubernetes cluster:

```bash
kubectl cluster-info
```

If this command cannot connect to a cluster, stop here and configure your Kubernetes environment first.

### 4.6 Kustomize

The project uses Kustomize through:

```bash
kubectl apply -k
```

Modern Kubernetes installations normally provide this functionality through `kubectl`.

Verify:

```bash
kubectl kustomize --help
```

## 5. Required Existing Observability Infrastructure

The application manifests expect an existing observability environment.

In particular, the application deployments expect an OTLP endpoint:

```text
http://jaeger-collector.tracing:4318/v1/traces
```

The Prometheus-related manifests use Prometheus Operator resources such as:

```text
ServiceMonitor
PrometheusRule
AlertmanagerConfig
```

Therefore, the Kubernetes cluster needs the corresponding monitoring/tracing infrastructure already available.

This application repository does **not** install the complete Prometheus Operator, Alertmanager, or Jaeger infrastructure itself.

Before deploying this lab, verify that the required infrastructure exists.

For example:

```bash
kubectl get namespaces
```

Look for the relevant monitoring/tracing namespaces.

Then check:

```bash
kubectl get pods -n monitoring
```

and:

```bash
kubectl get pods -n tracing
```

The exact pod names depend on how the observability stack was installed.

## 6. Navigate to the Lab

From Git Bash:

```bash
cd ~/Documents/Workspace/GitHub/markdown-playground/Observability/04-instrumentation-and-custom-metrics
```

Verify:

```bash
pwd
```

Then:

```bash
ls
```

You should see:

```text
application
kubernetes-manifest
alerts-alertmanager-servicemonitor-manifest
test.sh
README.md
```

## 7. Stage 1 — Run the Applications Locally

We first validate the Node.js applications before involving Docker or Kubernetes.

This isolates application problems from infrastructure problems.

## 8. Install Service B Dependencies

Open **Terminal 1**.

Navigate to Service B:

```bash
cd ~/Documents/Workspace/GitHub/markdown-playground/Observability/04-instrumentation-and-custom-metrics/application/service-b
```

Verify:

```bash
pwd
```

Install dependencies:

```bash
npm install
```

Wait for npm to complete.

The Service B package contains the OpenTelemetry tracing dependencies and the Express application dependencies.

## 9. Start Service B

From the Service B directory:

```bash
npm start
```

Service B listens on:

```text
3002
```

Keep this terminal open.

Do not press `Ctrl+C`.

## 10. Test Service B

Open **Terminal 2**.

You can remain in any directory.

Run:

```bash
curl http://localhost:3002/healthy
```

Expected:

```json
{"status":"healthy","service":"instrumentation-service-b"}
```

Now test:

```bash
curl http://localhost:3002/hello
```

Expected:

```text
Hello from Instrumentation Service B!
```

If these work, Service B is healthy.

## 11. Install Service A Dependencies

In Terminal 2:

```bash
cd ~/Documents/Workspace/GitHub/markdown-playground/Observability/04-instrumentation-and-custom-metrics/application/service-a
```

Install dependencies:

```bash
npm install
```

The current Service A dependency set includes:

* OpenTelemetry SDK
* OTLP trace exporter
* HTTP instrumentation
* Express instrumentation
* `@prometheus-io/client`
* Express
* Axios
* Morgan
* Pino
* dotenv

## 12. Start Service A

From the Service A directory:

```bash
npm start
```

Service A listens on:

```text
3001
```

Keep Terminal 2 running.

At this point:

```text
Terminal 1
└── Service B
    └── localhost:3002

Terminal 2
└── Service A
    └── localhost:3001
```

## 13. Test Service A

Open **Terminal 3**.

Test health:

```bash
curl http://localhost:3001/healthy
```

Expected:

```json
{"status":"healthy","service":"instrumentation-service-a"}
```

## 14. Test the Example Endpoint

Run:

```bash
curl http://localhost:3001/example
```

The endpoint performs a small operation and reports its duration.

The exact duration will vary.

For example:

```json
{
  "message": "Example operation completed",
  "duration_seconds": 0.101
}
```

Do not expect the exact same duration on every execution.

## 15. Test Service A → Service B

Run:

```bash
curl http://localhost:3001/call-service-b
```

Expected:

```json
{
  "service": "instrumentation-service-a",
  "downstream_response": "Hello from Instrumentation Service B!"
}
```

This is an important test.

It proves:

```text
Client
  |
  v
Service A :3001
  |
  | HTTP
  v
Service B :3002
```

If this fails, do not proceed to Docker or Kubernetes yet.

First verify Service B directly:

```bash
curl http://localhost:3002/hello
```

## 16. Test the Metrics Endpoint

Service A exposes:

```text
/metrics
```

Run:

```bash
curl http://localhost:3001/metrics
```

The output will be large.

It contains Node.js runtime metrics and application-specific metrics.

To focus on the custom HTTP counter:

```bash
curl -s http://localhost:3001/metrics | grep http_requests_total
```

You should see something similar to:

```text
# HELP http_requests_total ...
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/healthy",status_code="200"} 1
```

The exact values depend on the requests already generated.

## 17. Verify That Requests Are Counted Correctly

Run:

```bash
curl -s http://localhost:3001/healthy
curl -s http://localhost:3001/healthy
```

Then:

```bash
curl -s http://localhost:3001/metrics | grep http_requests_total
```

The `/healthy` count should increase.

The important behavior is that completed requests are counted once.

There should **not** be an artificial:

```text
status_code="in_progress"
```

series for the request counter.

The application uses `active_requests` for requests that are currently in progress.

## 18. Verify Active Requests

Run:

```bash
curl -s http://localhost:3001/metrics | grep active_requests
```

This is a Gauge.

Conceptually:

```text
Request starts
      |
      v
active_requests + 1
      |
      v
Request completes
      |
      v
active_requests - 1
```

A Gauge can increase and decrease.

This is different from the request Counter.

## 19. Verify Histogram Metrics

Run:

```bash
curl -s http://localhost:3001/metrics | grep http_request_duration_seconds
```

You should see histogram-related series such as:

```text
http_request_duration_seconds_bucket
http_request_duration_seconds_count
http_request_duration_seconds_sum
```

The configured buckets are:

```text
0.1 seconds
0.5 seconds
1 second
2 seconds
5 seconds
```

## 20. Generate Histogram Data

Run:

```bash
curl -s http://localhost:3001/example
curl -s http://localhost:3001/example
curl -s http://localhost:3001/example
curl -s http://localhost:3001/example
curl -s http://localhost:3001/example
```

Then:

```bash
curl -s http://localhost:3001/metrics | grep http_request_duration_seconds
```

The histogram should now contain observations from these requests.

## 21. Verify Summary Metrics

Run:

```bash
curl -s http://localhost:3001/metrics | grep http_request_duration_summary_seconds
```

The Summary uses configured percentiles:

```text
0.50
0.90
0.95
0.99
```

These correspond to:

```text
50th percentile
90th percentile
95th percentile
99th percentile
```

The exact values depend on the observed requests.

## 22. Test Error Endpoints

The application contains endpoints for generating different response scenarios.

Test:

```bash
curl -i http://localhost:3001/serverError
```

Then:

```bash
curl -i http://localhost:3001/notFound
```

Afterward inspect:

```bash
curl -s http://localhost:3001/metrics | grep http_requests_total
```

This allows us to observe different HTTP status-code labels.

## 23. Test Logging

Run:

```bash
curl http://localhost:3001/logs
```

Look at the Service A terminal.

You should see application logging activity.

The application uses:

* Morgan for HTTP access logging
* Pino for structured application logging

## 24. Local Testing Complete

At this point, verify all of the following:

```text
[ ] Service B starts
[ ] Service B /healthy works
[ ] Service B /hello works
[ ] Service A starts
[ ] Service A /healthy works
[ ] Service A /example works
[ ] Service A /call-service-b works
[ ] Service A /metrics works
[ ] Counter works
[ ] Gauge exists
[ ] Histogram exists
[ ] Summary exists
[ ] Logs are generated
```

Only continue when these tests pass.

## 25. Stop the Local Applications Before Docker

Go to Terminal 1.

Press:

```text
Ctrl+C
```

This stops Service B.

Go to Terminal 2.

Press:

```text
Ctrl+C
```

This stops Service A.

Terminal 3 can remain open.

`Ctrl+C` does not delete your source code or dependencies.

## 26. Stage 2 — Build Docker Images

Now we package the applications into Docker images.

The project uses these image names:

```text
sachinrajguru/instrumentation-service-a:1.0.0
sachinrajguru/instrumentation-service-b:1.0.0
```

The Dockerfiles use Node.js 24 Alpine and install dependencies with:

```bash
npm ci --omit=dev
```

This uses the committed lock file for the container installation.

## 27. Build Service A Image

Navigate to Service A:

```bash
cd ~/Documents/Workspace/GitHub/markdown-playground/Observability/04-instrumentation-and-custom-metrics/application/service-a
```

Build:

```bash
docker build -t sachinrajguru/instrumentation-service-a:1.0.0 .
```

Wait for the build to finish.

Then verify:

```bash
docker images
```

Look for:

```text
sachinrajguru/instrumentation-service-a
```

## 28. Build Service B Image

Navigate to Service B:

```bash
cd ~/Documents/Workspace/GitHub/markdown-playground/Observability/04-instrumentation-and-custom-metrics/application/service-b
```

Build:

```bash
docker build -t sachinrajguru/instrumentation-service-b:1.0.0 .
```

Verify:

```bash
docker images
```

You should now have both images.

## 29. Inspect the Docker Images

Service A:

```bash
docker image inspect sachinrajguru/instrumentation-service-a:1.0.0
```

Service B:

```bash
docker image inspect sachinrajguru/instrumentation-service-b:1.0.0
```

If Docker returns image information, the images exist locally.

## 30. Run Service B as a Container

Start Service B:

```bash
docker run --name instrumentation-service-b -p 3002:3002 \
  sachinrajguru/instrumentation-service-b:1.0.0
```

Keep the terminal running.

Open another terminal and test:

```bash
curl http://localhost:3002/healthy
```

Expected:

```json
{"status":"healthy","service":"instrumentation-service-b"}
```

## 31. Run Service A as a Container

For local Docker testing, Service A needs to reach Service B.

Create a Docker network:

```bash
docker network create instrumentation-network
```

If Service B is already running, connect it:

```bash
docker network connect instrumentation-network instrumentation-service-b
```

Stop and remove the previous Service A/Service B containers if necessary before recreating them with the network configuration.

A cleaner approach is to start both services on the same Docker network.

Service B:

```bash
docker run -d \
  --name instrumentation-service-b \
  --network instrumentation-network \
  -p 3002:3002 \
  sachinrajguru/instrumentation-service-b:1.0.0
```

Service A:

```bash
docker run -d \
  --name instrumentation-service-a \
  --network instrumentation-network \
  -p 3001:3001 \
  -e SERVICE_B_URI=http://instrumentation-service-b:3002 \
  sachinrajguru/instrumentation-service-a:1.0.0
```

Check:

```bash
docker ps
```

## 32. Test the Dockerized Applications

Service B:

```bash
curl http://localhost:3002/healthy
```

Service A:

```bash
curl http://localhost:3001/healthy
```

Service A → Service B:

```bash
curl http://localhost:3001/call-service-b
```

Metrics:

```bash
curl -s http://localhost:3001/metrics | grep http_requests_total
```

If all work, the Docker images are functioning.

## 33. Stop Docker Containers

When Docker testing is complete:

```bash
docker stop instrumentation-service-a
docker stop instrumentation-service-b
```

Remove the containers:

```bash
docker rm instrumentation-service-a
docker rm instrumentation-service-b
```

The images are still available.

## 34. Optional Docker Network Cleanup

Check:

```bash
docker network ls
```

Remove the lab network:

```bash
docker network rm instrumentation-network
```

Only remove this network if you created it specifically for this lab and no other container needs it.

## 35. Stage 3 — Push Images to Docker Hub

The Kubernetes manifests reference:

```text
sachinrajguru/instrumentation-service-a:1.0.0
sachinrajguru/instrumentation-service-b:1.0.0
```

Therefore, the images must be available to the Kubernetes cluster unless the cluster can use the same locally built images.

Log in:

```bash
docker login
```

Follow Docker's authentication prompts.

## 36. Push Service A

```bash
docker push sachinrajguru/instrumentation-service-a:1.0.0
```

Wait until the push completes.

## 37. Push Service B

```bash
docker push sachinrajguru/instrumentation-service-b:1.0.0
```

Wait until the push completes.

## 38. Verify the Images

You can verify locally:

```bash
docker image inspect sachinrajguru/instrumentation-service-a:1.0.0
```

and:

```bash
docker image inspect sachinrajguru/instrumentation-service-b:1.0.0
```

The Kubernetes deployments are configured to use the matching Service A and Service B images.

## 39. Stage 4 — Deploy to Kubernetes

First confirm the cluster:

```bash
kubectl cluster-info
```

Check nodes:

```bash
kubectl get nodes
```

Confirm the cluster is healthy before deploying.

## 40. Create the `dev` Namespace

From the project root:

```bash
cd ~/Documents/Workspace/GitHub/markdown-playground/Observability/04-instrumentation-and-custom-metrics
```

Create:

```bash
kubectl create namespace dev
```

If the namespace already exists, that is not necessarily a problem.

Check:

```bash
kubectl get namespace dev
```

## 41. Understand the Kubernetes Services

Service A:

```text
a-service
Type: LoadBalancer
Port: 80
Target: 3001
```

Service B:

```text
b-service
Type: ClusterIP
Port: 80
Target: 3002
```

Service B is intentionally internal.

Service A is the externally reachable application entry point.

The Kubernetes manifests define these services and their selectors.

## 42. Deploy the Applications

From:

```text
04-instrumentation-and-custom-metrics/
```

run:

```bash
kubectl apply -k kubernetes-manifest/
```

Kustomize processes the resources defined in:

```text
kubernetes-manifest/kustomization.yml
```

These include:

```text
Service A Deployment
Service A Service
Service B Deployment
Service B Service
```

## 43. Check the Pods

Run:

```bash
kubectl get pods -n dev
```

You should eventually see both applications running.

For more detail:

```bash
kubectl get pods -n dev -o wide
```

Wait until the pods reach:

```text
Running
```

and preferably:

```text
READY 1/1
```

## 44. Check the Deployments

```bash
kubectl get deployments -n dev
```

Expected deployments:

```text
service-a-deployment
service-b-deployment
```

## 45. Check the Services

```bash
kubectl get svc -n dev
```

Expected:

```text
a-service
b-service
```

Service A should be:

```text
LoadBalancer
```

Service B should be:

```text
ClusterIP
```

## 46. Check Service A's LoadBalancer

Run:

```bash
kubectl get svc a-service -n dev
```

Look at:

```text
EXTERNAL-IP
```

or the environment-specific address returned by your cluster.

Save that value.

For the rest of this guide we refer to it as:

```text
<LOAD_BALANCER_ADDRESS>
```

Do not type the angle brackets.

## 47. Test Service A Through Kubernetes

Run:

```bash
curl http://<LOAD_BALANCER_ADDRESS>/healthy
```

Expected:

```json
{"status":"healthy","service":"instrumentation-service-a"}
```

Test Service A → Service B:

```bash
curl http://<LOAD_BALANCER_ADDRESS>/call-service-b
```

Expected:

```json
{
  "service": "instrumentation-service-a",
  "downstream_response": "Hello from Instrumentation Service B!"
}
```

This confirms Kubernetes DNS/service communication.

Service A uses:

```text
http://b-service.dev
```

for Service B inside the cluster.

## 48. Understand Kubernetes DNS

Inside the cluster:

```text
b-service.dev
```

refers to Service B in namespace `dev`.

The fully qualified service name is conceptually:

```text
b-service.dev.svc.cluster.local
```

This allows Service A to communicate with Service B without knowing the Service B pod IP.

Pod IPs can change.

The Kubernetes Service provides stable service discovery.

## 49. Verify Service B Internally

Find the Service A pod:

```bash
kubectl get pods -n dev
```

Then:

```bash
kubectl exec -it <SERVICE_A_POD> -n dev -- \
  wget -qO- http://b-service.dev/hello
```

Expected:

```text
Hello from Instrumentation Service B!
```

If this works, Service A can reach Service B through Kubernetes service discovery.

## 50. Stage 5 — Configure Prometheus Monitoring

The project includes a `ServiceMonitor`.

The ServiceMonitor tells Prometheus how to discover and scrape Service A.

It targets:

```text
namespace: dev
service label:
  app: a-service

path:
  /metrics

port:
  http

interval:
  15s
```

This is defined in the project's `serviceMonitor.yml`.

## 51. Apply the Observability Resources

Run:

```bash
kubectl apply -k alerts-alertmanager-servicemonitor-manifest/
```

This applies the resources defined by the Kustomization.

They include:

```text
PrometheusRule
email Secret example
AlertmanagerConfig
ServiceMonitor
```

## 52. Verify the ServiceMonitor

Run:

```bash
kubectl get servicemonitor -n monitoring
```

Look for:

```text
a-service-service-monitor
```

Inspect it:

```bash
kubectl get servicemonitor \
  a-service-service-monitor \
  -n monitoring \
  -o yaml
```

Verify:

```text
namespaceSelector → dev
selector           → app: a-service
endpoint           → /metrics
port               → http
interval           → 15s
```

## 53. Verify Prometheus Rules

Run:

```bash
kubectl get prometheusrule -n monitoring
```

You should see:

```text
instrumentation-custom-alert-rules
```

The project defines alerts including:

```text
HighCpuUsage
PodRestart
```

The `PodRestart` rule fires when the container restart increase exceeds the configured threshold during the specified time window.

## 54. Verify Alertmanager Configuration

Run:

```bash
kubectl get alertmanagerconfig -n monitoring
```

The project configuration defines email routing for:

```text
critical
warning
```

severity levels.

The configuration expects credentials to be supplied through the Kubernetes Secret:

```text
mail-pass
```

The repository intentionally provides an example secret structure rather than a real password.

## 55. IMPORTANT — Do Not Commit Email Credentials

Do not put a real password into:

```text
email-secret.example.yml
```

The example contains:

```text
REPLACE_WITH_YOUR_EMAIL_APP_PASSWORD
```

For a real local deployment, create a separate secret file that is excluded from Git.

Never commit:

```text
Gmail password
SMTP password
API secret
application password
```

to the repository.

## 56. Validate Alertmanager Configuration Before Applying

The project itself recommends validating the resource against the installed Prometheus Operator version.

A server-side dry run can be used:

```bash
kubectl apply \
  --dry-run=server \
  -f alerts-alertmanager-servicemonitor-manifest/alertmanagerconfig.yml
```

If the cluster rejects fields because of an Operator-version difference, use the error to adapt the configuration to the installed version.

Do not blindly assume every Prometheus Operator version supports exactly the same fields.

## 57. Stage 6 — Verify Prometheus Metrics

Get the Service A address again:

```bash
kubectl get svc a-service -n dev
```

Test the root endpoint:

```bash
curl http://<LOAD_BALANCER_ADDRESS>/
```

Then:

```bash
curl http://<LOAD_BALANCER_ADDRESS>/metrics
```

You should see application metrics including:

```text
http_requests_total
http_request_duration_seconds
http_request_duration_summary_seconds
active_requests
```

## 58. Generate Normal Traffic

Run:

```bash
curl http://<LOAD_BALANCER_ADDRESS>/healthy
```

Then:

```bash
curl http://<LOAD_BALANCER_ADDRESS>/example
```

Then:

```bash
curl http://<LOAD_BALANCER_ADDRESS>/call-service-b
```

Generate several requests.

This creates metric observations that Prometheus can scrape.

## 59. Use the Traffic-Generation Script

The repository contains:

```text
test.sh
```

The script expects exactly one argument:

```text
LOAD_BALANCER_ADDRESS
```

Usage:

```bash
./test.sh <LOAD_BALANCER_ADDRESS>
```

For example:

```bash
./test.sh abc123.example.com
```

The script generates 1,000 requests with a small delay between requests.

It randomly selects from:

```text
/
 /healthy
 /serverError
 /notFound
 /logs
 /example
 /metrics
 /call-service-b
```

with `/call-service-b` intentionally appearing multiple times to increase the probability of generating distributed-tracing traffic.

## 60. Make `test.sh` Executable

If Git Bash reports a permission error:

```bash
chmod +x test.sh
```

Then:

```bash
./test.sh <LOAD_BALANCER_ADDRESS>
```

The script prints the HTTP status code for each generated request and finishes with:

```text
Completed 1000 requests.
```

## 61. Understand What the Traffic Script Generates

The script intentionally creates different kinds of application activity:

```text
Successful requests
       |
       +---- metrics

Error requests
       |
       +---- status-code metrics

/example
       |
       +---- latency observations

/call-service-b
       |
       +---- distributed traces

/logs
       |
       +---- application logging
```

This gives Prometheus, the logging system, and Jaeger more useful data to inspect.

## 62. Stage 7 — Distributed Tracing

The applications use OpenTelemetry.

Service A initializes:

```text
HTTP instrumentation
Express instrumentation
OTLP trace exporter
```

Service B does the same.

The Kubernetes deployments configure:

```text
http://jaeger-collector.tracing:4318/v1/traces
```

as the OTLP trace endpoint.

## 63. Understand the Trace Flow

A request to:

```text
/call-service-b
```

creates this logical flow:

```text
Client
  |
  v
Service A
  |
  | HTTP + trace context
  v
Service B
  |
  v
Response
```

OpenTelemetry uses W3C Trace Context propagation.

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

The same Trace ID connects the distributed operation.

## 64. Generate a Trace Manually

Run:

```bash
curl http://<LOAD_BALANCER_ADDRESS>/call-service-b
```

Run it several times:

```bash
curl http://<LOAD_BALANCER_ADDRESS>/call-service-b
curl http://<LOAD_BALANCER_ADDRESS>/call-service-b
curl http://<LOAD_BALANCER_ADDRESS>/call-service-b
```

Then open your Jaeger UI.

Search for the Service A service name:

```text
instrumentation-service-a
```

Look for traces containing Service A and the downstream Service B operation.

## 65. Expected Distributed Trace

Conceptually, the trace should represent:

```text
Trace

Service A
  |
  +-- HTTP request to Service B
          |
          +-- Service B /hello
```

This allows us to investigate:

* request latency;
* downstream service behavior;
* service-to-service communication;
* failures;
* distributed request flow.

## 66. Stage 8 — Test the Pod Restart Alert

The application contains a `/crash` endpoint specifically for testing failure behavior.

This endpoint intentionally terminates the application process.

Do not use it casually in a production environment.

Use it only in this controlled lab.

## 67. Trigger the Crash

Run:

```bash
curl http://<LOAD_BALANCER_ADDRESS>/crash
```

The Service A process should terminate.

Kubernetes should detect the failed container and restart it.

Check:

```bash
kubectl get pods -n dev
```

Look at the `RESTARTS` column.

## 68. Inspect the Service A Pod

Find the Service A pod:

```bash
kubectl get pods -n dev
```

Then:

```bash
kubectl describe pod <SERVICE_A_POD> -n dev
```

Look at:

```text
Events
Restart Count
Container State
Last State
```

You can also inspect logs:

```bash
kubectl logs <SERVICE_A_POD> -n dev
```

## 69. Important Alerting Note

The project's `PodRestart` alert uses:

```text
increase(kube_pod_container_status_restarts_total[15m]) > 2
```

and marks the alert as:

```text
severity: critical
```

Therefore, a single crash may restart the pod but may not immediately satisfy the alert threshold.

The alert is designed to detect repeated restarts rather than a single restart.

## 70. Testing Repeated Restarts

If you intentionally want to test the configured restart alert, generate enough controlled restarts for the rule to become true.

After each test, check:

```bash
kubectl get pods -n dev
```

and:

```bash
kubectl describe pod <SERVICE_A_POD> -n dev
```

Then inspect Prometheus/Alertmanager for the resulting alert.

Do not perform repeated crash testing against a production workload.

## 71. Stage 9 — Troubleshooting

### 71.1 Service A Does Not Start Locally

Check:

```bash
node --version
```

Then:

```bash
npm install
```

Then:

```bash
npm start
```

Look at the first error shown in the terminal.

Do not focus on the final stack-trace line first. Find the first meaningful error message.

## 72. Service B Does Not Start

Check:

```bash
npm install
```

Then:

```bash
npm start
```

Check port:

```bash
netstat -ano | grep ":3002"
```

## 73. Port 3001 Is Already in Use

Check:

```bash
netstat -ano | grep ":3001"
```

Port `3001` belongs to Service A in this lab.

If you previously started Service A and forgot to stop it, return to that terminal and press:

```text
Ctrl+C
```

## 74. Port 3002 Is Already in Use

Check:

```bash
netstat -ano | grep ":3002"
```

Port `3002` belongs to Service B.

Stop the existing Service B process if it belongs to this lab.

Do not terminate an unknown process simply because it uses the same port.

## 75. Service A Cannot Reach Service B Locally

First:

```bash
curl http://localhost:3002/hello
```

If this fails, fix Service B.

If it works, test:

```bash
curl http://localhost:3001/call-service-b
```

Check the Service A `SERVICE_B_URI` configuration.

## 76. Pod Is Not Starting

Run:

```bash
kubectl get pods -n dev
```

Then:

```bash
kubectl describe pod <POD_NAME> -n dev
```

Then:

```bash
kubectl logs <POD_NAME> -n dev
```

Look for:

```text
ImagePullBackOff
CrashLoopBackOff
CreateContainerConfigError
Readiness probe failure
Liveness probe failure
```

## 77. ImagePullBackOff

Check:

```bash
kubectl describe pod <POD_NAME> -n dev
```

Verify the image exists:

```bash
docker pull sachinrajguru/instrumentation-service-a:1.0.0
```

For Service B:

```bash
docker pull sachinrajguru/instrumentation-service-b:1.0.0
```

If the Docker Hub repository is private, Kubernetes requires an appropriate image-pull secret.

## 78. `/metrics` Does Not Work in Kubernetes

Check Service A logs:

```bash
kubectl logs <SERVICE_A_POD> -n dev
```

Then test directly inside the pod:

```bash
kubectl exec -it <SERVICE_A_POD> -n dev -- \
  wget -qO- http://localhost:3001/metrics
```

If this works inside the pod but Prometheus cannot see it, investigate the ServiceMonitor.

## 79. Prometheus Does Not Show Service A Metrics

Check:

```bash
kubectl get servicemonitor -n monitoring
```

Then:

```bash
kubectl get servicemonitor \
  a-service-service-monitor \
  -n monitoring \
  -o yaml
```

Verify:

```text
namespaceSelector
selector
service labels
endpoint port
metrics path
Prometheus Operator configuration
```

The ServiceMonitor expects the Service A Kubernetes Service to have:

```text
app: a-service
```

and scrapes:

```text
/metrics
```

on the named:

```text
http
```

port.

## 80. Service A Cannot Reach Service B in Kubernetes

Check:

```bash
kubectl get svc -n dev
```

You should have:

```text
a-service
b-service
```

Find the Service A pod:

```bash
kubectl get pods -n dev
```

Then test:

```bash
kubectl exec -it <SERVICE_A_POD> -n dev -- \
  wget -qO- http://b-service.dev/hello
```

Expected:

```text
Hello from Instrumentation Service B!
```

## 81. Traces Are Missing

Check Service A:

```bash
kubectl logs <SERVICE_A_POD> -n dev
```

Check Service B:

```bash
kubectl logs <SERVICE_B_POD> -n dev
```

Check the deployment environment:

```bash
kubectl get deployment service-a-deployment -n dev -o yaml
```

Verify:

```text
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
```

is configured as expected.

The current Kubernetes manifest points to:

```text
http://jaeger-collector.tracing:4318/v1/traces
```

## 82. Check Jaeger Connectivity

If the application is configured correctly but traces do not appear, verify that the Jaeger collector exists:

```bash
kubectl get pods -n tracing
```

Then:

```bash
kubectl get svc -n tracing
```

The exact resource names depend on the Jaeger deployment.

The important requirement is that the endpoint configured in the application is reachable from the application pods.

## 83. Stage 10 — Complete Cleanup

Cleanup should be performed in stages.

Do not immediately delete your source files.

## 84. Stop Local Node.js Applications

If Service A or Service B is still running locally:

Service A terminal:

```text
Ctrl+C
```

Service B terminal:

```text
Ctrl+C
```

No source files are deleted.

## 85. Stop and Remove Docker Containers

Check:

```bash
docker ps
```

If the lab containers are running:

```bash
docker stop instrumentation-service-a
docker stop instrumentation-service-b
```

Then:

```bash
docker rm instrumentation-service-a
docker rm instrumentation-service-b
```

If a container does not exist, that simply means it has already been removed.

## 86. Remove the Docker Network

If you created:

```text
instrumentation-network
```

remove it:

```bash
docker network rm instrumentation-network
```

Only do this if the network belongs to this lab.

## 87. Clean Up Kubernetes Application Resources

From the project root:

```bash
cd ~/Documents/Workspace/GitHub/markdown-playground/Observability/04-instrumentation-and-custom-metrics
```

Delete the application resources:

```bash
kubectl delete -k kubernetes-manifest/
```

## 88. Clean Up Monitoring Configuration

Delete:

```bash
kubectl delete -k alerts-alertmanager-servicemonitor-manifest/
```

This removes the project's:

```text
PrometheusRule
ServiceMonitor
AlertmanagerConfig
example email Secret
```

as represented by the Kustomization.

## 89. Delete the Development Namespace

After confirming that the application resources are no longer needed:

```bash
kubectl delete namespace dev
```

Wait for deletion:

```bash
kubectl get namespace dev
```

Once it disappears, the application namespace has been removed.

## 90. Important: Do Not Delete the Monitoring Namespace

Do **not** run:

```bash
kubectl delete namespace monitoring
```

unless you intentionally want to remove the entire monitoring stack.

The project only owns its observability configuration resources inside the monitoring environment.

Likewise, do not delete the `tracing` namespace simply because this lab uses Jaeger.

The Prometheus and Jaeger infrastructure may be shared by other projects.

## 91. Optional — Remove Docker Images

If you want to reclaim local disk space:

```bash
docker rmi sachinrajguru/instrumentation-service-a:1.0.0
```

and:

```bash
docker rmi sachinrajguru/instrumentation-service-b:1.0.0
```

This removes the local copies.

It does **not** delete the Docker Hub repositories.

If you need the images again later, rebuild or pull them.

## 92. Optional — Remove `node_modules`

Normally, do **not** remove `node_modules`.

Keeping them means the next local execution can start immediately.

If you specifically want to reclaim disk space:

Service A:

```bash
cd ~/Documents/Workspace/GitHub/markdown-playground/Observability/04-instrumentation-and-custom-metrics/application/service-a
rm -rf node_modules
```

Service B:

```bash
cd ~/Documents/Workspace/GitHub/markdown-playground/Observability/04-instrumentation-and-custom-metrics/application/service-b
rm -rf node_modules
```

Next time, reinstall:

```bash
npm install
```

or, when you specifically want a clean lock-file-based installation:

```bash
npm ci
```

## 93. Never Delete These During Normal Cleanup

Do not delete:

```text
package.json
package-lock.json
index.js
tracing.js
Dockerfile
.dockerignore
Kubernetes YAML files
test.sh
README.md
```

These are project files.

Cleanup means stopping/removing runtime resources—not deleting the source project.

## 94. Final Cleanup Verification

After cleanup, check local Node processes if necessary:

```bash
tasklist | grep node
```

Check Docker:

```bash
docker ps
```

Check Kubernetes:

```bash
kubectl get pods -n dev
```

The `dev` namespace should no longer exist if you deleted it.

Check Docker images if you removed them:

```bash
docker images
```

## 95. Complete Execution Checklist

Use this checklist every time you perform the lab.

### Prerequisites

* [ ] Node.js available
* [ ] npm available
* [ ] Git available
* [ ] curl available
* [ ] Docker available
* [ ] Docker daemon running
* [ ] kubectl available
* [ ] Kubernetes cluster accessible
* [ ] Prometheus/Operator infrastructure available
* [ ] Jaeger/tracing infrastructure available

### Local Application

* [ ] Service B dependencies installed
* [ ] Service B started
* [ ] Service B `/healthy` tested
* [ ] Service B `/hello` tested
* [ ] Service A dependencies installed
* [ ] Service A started
* [ ] Service A `/healthy` tested
* [ ] Service A `/example` tested
* [ ] Service A `/call-service-b` tested
* [ ] `/metrics` tested
* [ ] Counter verified
* [ ] Gauge verified
* [ ] Histogram verified
* [ ] Summary verified
* [ ] Logging verified

### Docker

* [ ] Service A image built
* [ ] Service B image built
* [ ] Images inspected
* [ ] Docker containers started
* [ ] Container health tested
* [ ] Service A → Service B tested
* [ ] Containers stopped
* [ ] Containers removed

### Docker Hub

* [ ] Docker login completed
* [ ] Service A image pushed
* [ ] Service B image pushed

### Kubernetes

* [ ] `dev` namespace created
* [ ] Application Kustomization applied
* [ ] Service A pod running
* [ ] Service B pod running
* [ ] Deployments verified
* [ ] Services verified
* [ ] Service A LoadBalancer address obtained
* [ ] Service A health tested
* [ ] Service A → Service B tested
* [ ] Kubernetes DNS tested

### Prometheus

* [ ] Observability Kustomization applied
* [ ] ServiceMonitor exists
* [ ] PrometheusRule exists
* [ ] `/metrics` accessible
* [ ] Prometheus receives Service A metrics

### Alertmanager

* [ ] AlertmanagerConfig exists
* [ ] Secret configured securely if email testing is required
* [ ] Alertmanager accepts configuration
* [ ] Warning/critical routes verified

### Tracing

* [ ] OTLP endpoint configured
* [ ] Service A generates traces
* [ ] Service B generates traces
* [ ] Service A → Service B request generated
* [ ] Jaeger receives traces
* [ ] Distributed trace inspected

### Traffic

* [ ] `test.sh` executable
* [ ] Traffic generated
* [ ] Metrics increased
* [ ] Logs generated
* [ ] Traces generated

### Alert Testing

* [ ] `/crash` understood
* [ ] Crash tested only in the lab
* [ ] Kubernetes restarted the container
* [ ] Restart count verified
* [ ] PodRestart alert evaluated

### Cleanup

* [ ] Local Node.js processes stopped
* [ ] Docker containers stopped
* [ ] Docker containers removed
* [ ] Lab Docker network removed if created
* [ ] Kubernetes application removed
* [ ] Monitoring configuration removed
* [ ] `dev` namespace removed
* [ ] Local Docker images removed if desired
* [ ] Source files retained

## 96. Quick Start — After the First Successful Setup

Once the entire lab has already been configured, future executions do not require repeating every installation step.

The normal workflow becomes:

```text
Start required observability infrastructure
        ↓
Build/pull current application images if required
        ↓
Deploy application
        ↓
Apply monitoring configuration
        ↓
Get LoadBalancer address
        ↓
Test Service A
        ↓
Test Service A → Service B
        ↓
Generate traffic
        ↓
Inspect Prometheus
        ↓
Inspect Jaeger
        ↓
Inspect Alertmanager
        ↓
Clean up
```

For local application-only development:

```text
Terminal 1
Service B → npm start

Terminal 2
Service A → npm start

Terminal 3
curl / test metrics
```

When finished:

```text
Terminal 1 → Ctrl+C
Terminal 2 → Ctrl+C
Terminal 3 → close or reuse
```

## 97. Final Architecture Summary

After completing the lab, the complete observability flow is:

```text
                         CLIENT
                           |
                           v
                  Kubernetes Service A
                     LoadBalancer
                           |
                           v
                  +----------------+
                  |   Service A    |
                  |    Node.js     |
                  |                |
                  | Metrics        |
                  | Logs           |
                  | Traces         |
                  +---+--------+---+
                      |        |
                 HTTP |        | /metrics
                      |        |
                      v        v
                Service B   Prometheus
                   |             |
                   |             | Alert
                  OTLP           v
                   |        Alertmanager
                   v             |
                 Jaeger          v
                              Email

Application Logs
       |
       v
  Fluent Bit
       |
       v
 Elasticsearch
       |
       v
     Kibana
```

The complete request path is:

```text
Client
  |
  v
Kubernetes Service A
  |
  v
Service A
  |
  | HTTP + trace context
  v
Service B
  |
  v
Response
```

The telemetry path is:

```text
                 Application
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
       Metrics       Logs       Traces
          |           |           |
          v           v           v
      Prometheus  Fluent Bit  OpenTelemetry
          |           |           |
          v           v           v
    Alertmanager  Elasticsearch  Jaeger
          |           |
          v           v
        Email       Kibana
```

This gives us a practical end-to-end observability lab covering **application instrumentation, Prometheus metrics, Docker, Kubernetes, ServiceMonitor, Prometheus alerting, Alertmanager, application logging, OpenTelemetry, OTLP, distributed tracing, Jaeger, traffic generation, troubleshooting, and cleanup**.
