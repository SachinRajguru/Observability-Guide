
## Distributed Tracing with Jaeger

> **File:** `01-distributed-tracing-with-Jaeger.md`

This guide demonstrates distributed tracing using OpenTelemetry and Jaeger on Amazon EKS.

We reuse the microservices application created in Topic 04 and the Elasticsearch deployment created in Topic 05.

The objective is to trace a request from Service A to Service B and analyze the complete request path through the Jaeger UI.

## Table of Contents

- [1. Objective](#1-objective)
- [2. Prerequisites](#2-prerequisites)
- [3. Observability Pillars](#3-observability-pillars)
- [4. What Is Distributed Tracing](#4-what-is-distributed-tracing)
- [5. Trace and Span](#5-trace-and-span)
- [6. Why Distributed Tracing Is Important](#6-why-distributed-tracing-is-important)
- [7. OpenTelemetry and Jaeger](#7-opentelemetry-and-jaeger)
- [8. Jaeger Architecture](#8-jaeger-architecture)
- [9. Jaeger v2 Architecture Used in This Lab](#9-jaeger-v2-architecture-used-in-this-lab)
- [10. Relationship with Previous Topics](#10-relationship-with-previous-topics)
- [11. Verify the EKS Cluster](#11-verify-the-eks-cluster)
- [12. Verify Elasticsearch from Topic 05](#12-verify-elasticsearch-from-topic-05)
- [13. Create the Tracing Namespace](#13-create-the-tracing-namespace)
- [14. Prepare Elasticsearch Credentials](#14-prepare-elasticsearch-credentials)
- [15. Prepare the Elasticsearch CA Certificate](#15-prepare-the-elasticsearch-ca-certificate)
- [16. Configure Jaeger](#16-configure-jaeger)
- [17. Add the Jaeger Helm Repository](#17-add-the-jaeger-helm-repository)
- [18. Validate the Helm Configuration](#18-validate-the-helm-configuration)
- [19. Install Jaeger](#19-install-jaeger)
- [20. Verify Jaeger](#20-verify-jaeger)
- [21. Configure Service A and Service B](#21-configure-service-a-and-service-b)
- [22. Generate Tracing Traffic](#22-generate-tracing-traffic)
- [23. Access the Jaeger UI](#23-access-the-jaeger-ui)
- [24. Find Service A Traces](#24-find-service-a-traces)
- [25. Trace Service A to Service B](#25-trace-service-a-to-service-b)
- [26. Understand the Trace Timeline](#26-understand-the-trace-timeline)
- [27. Troubleshooting with Tracing](#27-troubleshooting-with-tracing)
- [28. Troubleshooting](#28-troubleshooting)
- [29. Validation Checklist](#29-validation-checklist)
- [30. Cleanup](#30-cleanup)
- [31. Important Notes](#31-important-notes)

## 1. Objective

In the previous observability topics, we implemented two pillars:

```text
Metrics
Logs
````

In this topic, we implement the third pillar:

```text
Distributed Tracing
```

We will use:

| Component     | Purpose                                   |
| ------------- | ----------------------------------------- |
| Amazon EKS    | Kubernetes platform                       |
| Kubernetes    | Application and observability platform    |
| Node.js       | Application runtime                       |
| OpenTelemetry | Application instrumentation and telemetry |
| Jaeger        | Distributed tracing backend and UI        |
| Elasticsearch | Persistent trace storage                  |
| Helm          | Jaeger installation                       |
| Service A     | Upstream application                      |
| Service B     | Downstream application                    |

The final tracing flow is:

```text
Service A
    |
    | OTLP/HTTP
    v
Jaeger
    |
    | HTTPS
    v
Elasticsearch
    |
    | Query
    v
Jaeger UI
```

For a distributed request:

```text
Client
  |
  v
Service A
  |
  | HTTP request
  v
Service B
  |
  v
Response
```

OpenTelemetry propagates trace context across the Service A to Service B request.

## 2. Prerequisites

This topic is a continuation of Topics 04 and 05.

The following should already exist.

### EKS cluster

Verify:

```bash
kubectl get nodes
```

Expected:

```text
NAME                                           STATUS   ROLES    AGE   VERSION
...
```

The exact node names and versions depend on the EKS cluster.

### Topic 04 application

Verify:

```bash
kubectl get pods -n dev
```

Verify services:

```bash
kubectl get svc -n dev
```

The application contains:

```text
a-service
b-service
```

Service A listens on:

```text
3001
```

Service B listens on:

```text
3002
```

Service A communicates with Service B through:

```text
http://b-service.dev
```

The important Service A endpoint for this topic is:

```text
/call-service-b
```

This endpoint generates a request from Service A to Service B.

### Topic 05 Elasticsearch

Verify:

```bash
kubectl get pods -n logging
```

Then:

```bash
kubectl get svc -n logging
```

The Elasticsearch deployment from Topic 05 is reused.

We do not deploy another Elasticsearch cluster for Topic 06.

## 3. Observability Pillars

Modern distributed applications require visibility across multiple dimensions.

```text
                 Observability
                      |
       +--------------+--------------+
       |              |              |
       v              v              v
    Metrics          Logs          Traces
       |              |              |
   Prometheus      Fluent Bit      OpenTelemetry
       |              |              |
    Grafana       Elasticsearch     Jaeger
```

### Metrics

Metrics provide numerical measurements.

Examples:

```text
CPU utilization
Memory utilization
Request count
Request latency
Error rate
```

Metrics help answer:

> What is happening?

### Logs

Logs provide detailed application or system events.

Examples:

```text
Request received
Authentication failed
Database connection failed
Application started
```

Logs help answer:

> What happened?

### Traces

Traces show the path taken by a request through a distributed system.

Traces help answer:

> Where did this request go, and how much time did each operation take?

The three signals complement each other.

## 4. What Is Distributed Tracing

Consider an e-commerce request:

```text
User
 |
 v
Load Balancer
 |
 v
Login Service
 |
 v
Service A
 |
 v
Service B
 |
 v
Payment Service
 |
 v
Database
```

The user sees only the final response.

Suppose the expected response time is:

```text
1 second
```

but the actual response takes:

```text
4 seconds
```

Metrics can tell us that latency increased.

Logs can tell us what individual services reported.

Tracing can show the request path and the time spent in each operation:

```text
Login Service       100 ms
Service A           200 ms
Service B           2.7 sec
Payment Service     300 ms
Database            700 ms
--------------------------------
Total               4.0 sec
```

This gives us a direction for further investigation.

Distributed tracing allows us to follow an individual request across multiple services and understand the operations involved in that request.

## 5. Trace and Span

### Trace

A trace represents the complete journey of one request.

Example:

```text
Trace ID: abc123

Client
  |
  v
Service A
  |
  v
Service B
  |
  v
Response
```

All of these operations belong to the same trace.

### Span

A span represents one operation within a trace.

For example:

```text
Trace
 |
 +-- Service A HTTP request
 |
 +-- Service A middleware
 |
 +-- Service A downstream request
 |
 +-- Service B HTTP request
 |
 +-- Service B /hello
```

A span can contain information such as:

* Operation name
* Start time
* Duration
* Service name
* Attributes
* Status
* Parent span
* Trace ID
* Span ID

A simplified relationship looks like:

```text
Trace
 |
 +-- Span A
       |
       +-- Span B
             |
             +-- Span C
```

The parent-child relationship helps us understand the request flow.

## 6. Why Distributed Tracing Is Important

Distributed tracing becomes particularly useful when applications contain multiple services.

Without tracing:

```text
User reports:

"The application is slow."
```

We may need to inspect:

```text
Service A logs
Service B logs
Service C logs
Load balancer information
Application metrics
Database metrics
```

Tracing connects the request path:

```text
Trace
 |
 +-- Service A       120 ms
 |
 +-- Service B       180 ms
 |
 +-- Payment         2.4 sec
 |
 +-- Database        900 ms
```

We can then investigate the span consuming the most time.

Common uses include:

* Latency analysis
* Service dependency analysis
* Error investigation
* Root-cause investigation
* Performance optimization
* Microservice troubleshooting

## 7. OpenTelemetry and Jaeger

OpenTelemetry and Jaeger have different responsibilities.

### OpenTelemetry

OpenTelemetry provides:

* APIs
* SDKs
* Instrumentation
* Context propagation
* Telemetry export
* OTLP

Our Node.js applications from Topic 04 already use OpenTelemetry.

### Jaeger

Jaeger provides the tracing backend and user interface.

The simplified architecture is:

```text
Application
    |
    | OpenTelemetry
    v
OTLP
    |
    v
Jaeger
    |
    v
Elasticsearch
    |
    v
Jaeger UI
```

The application does not need to use Jaeger-specific instrumentation libraries.

This keeps application instrumentation vendor-neutral.

## 8. Jaeger Architecture

Older Jaeger deployments commonly used a component model similar to:

```text
Application
    |
    v
Jaeger Agent
    |
    v
Jaeger Collector
    |
    v
Storage
    |
    v
Jaeger Query
    |
    v
Jaeger UI
```

This is important to recognize because many older tutorials still use this architecture.

For this project, we use Jaeger v2.

## 9. Jaeger v2 Architecture Used in This Lab

Jaeger v2 is built around the OpenTelemetry Collector framework.

For this learning environment, the Helm chart deploys Jaeger using a unified deployment model.

The architecture is:

```text
+---------------------------+
|        Service A          |
|                           |
|    OpenTelemetry SDK      |
+-------------+-------------+
              |
              | OTLP/HTTP
              |
              v
+---------------------------+
|          Jaeger           |
|                           |
|   OTLP Receiver           |
|   Trace Processing        |
|   Query / UI              |
|   Storage Integration     |
+-------------+-------------+
              |
              | HTTPS
              |
              v
+---------------------------+
|      Elasticsearch        |
|       Topic 05            |
+---------------------------+
```

The Jaeger Service exposes the UI and OTLP endpoints.

The application sends traces to:

```text
http://jaeger.tracing.svc.cluster.local:4318/v1/traces
```

The flow is:

```text
Service A
    |
    | OTLP/HTTP
    v
Jaeger
    |
    | HTTPS
    v
Elasticsearch
```

Jaeger then retrieves stored traces when we use the Jaeger UI.

## 10. Relationship with Previous Topics

This topic intentionally reuses the previous work.

### Topic 04

Topic 04 created:

```text
Service A
Service B
```

The services already contain OpenTelemetry tracing instrumentation.

Service A can call Service B through:

```text
/call-service-b
```

This gives us a real distributed request to trace.

### Topic 05

Topic 05 deployed Elasticsearch using ECK.

Fluent Bit sends Kubernetes logs to Elasticsearch.

For Topic 06, we reuse the same Elasticsearch deployment as the trace storage backend.

Therefore:

```text
                 Elasticsearch
                  /          \
                 /            \
                v              v
           Fluent Bit        Jaeger
                |              |
                v              v
              Logs           Traces
                |              |
                v              v
             Kibana         Jaeger UI
```

The collection paths remain separate:

```text
Logs:
Fluent Bit -> Elasticsearch -> Kibana

Traces:
OpenTelemetry -> Jaeger -> Elasticsearch -> Jaeger UI
```

## 11. Verify the EKS Cluster

Run:

```bash
kubectl get nodes
```

Verify the namespaces:

```bash
kubectl get ns
```

We expect at least:

```text
dev
logging
```

We will create:

```text
tracing
```

for Jaeger.

## 12. Verify Elasticsearch from Topic 05

Run:

```bash
kubectl get pods -n logging
```

Then:

```bash
kubectl get svc -n logging
```

For the ECK-managed Elasticsearch resource used in Topic 05, the HTTP Service follows the ECK naming convention:

```text
elasticsearch-es-http
```

Verify:

```bash
kubectl get svc elasticsearch-es-http -n logging
```

Expected:

```text
NAME                    TYPE        CLUSTER-IP   PORT(S)
elasticsearch-es-http   ClusterIP   ...          9200/TCP
```

Verify the Elasticsearch credentials Secret:

```bash
kubectl get secret elasticsearch-es-elastic-user -n logging
```

Verify the Elasticsearch public CA Secret:

```bash
kubectl get secret elasticsearch-es-http-certs-public -n logging
```

If these resources do not exist, complete Topic 05 first.

## 13. Create the Tracing Namespace

Create the namespace:

```bash
kubectl create namespace tracing
```

If it already exists, Kubernetes will report that it already exists.

Verify:

```bash
kubectl get namespace tracing
```

Expected:

```text
NAME       STATUS   AGE
tracing    Active   ...
```

Using a separate namespace makes it easier to manage:

* RBAC
* Resources
* Troubleshooting
* Cleanup
* Environment boundaries

## 14. Prepare Elasticsearch Credentials

The Elasticsearch credentials Secret exists in:

```text
logging
```

namespace.

Kubernetes Secrets are namespace-scoped, so Jaeger in the `tracing` namespace cannot directly reference a Secret from `logging`.

We therefore create a second Secret in `tracing`.

First retrieve the current Elasticsearch password into a shell variable:

```bash
ELASTIC_PASSWORD=$(kubectl get secret elasticsearch-es-elastic-user \
  -n logging \
  -o jsonpath='{.data.elastic}' | base64 --decode)
```

Create the Jaeger Secret:

```bash
kubectl create secret generic jaeger-elasticsearch-credentials \
  -n tracing \
  --from-literal=username=elastic \
  --from-literal=password="${ELASTIC_PASSWORD}"
```

Verify:

```bash
kubectl get secret jaeger-elasticsearch-credentials -n tracing
```

Do not print the password unnecessarily.

Do not commit this Secret to Git.

## 15. Prepare the Elasticsearch CA Certificate

ECK provides the Elasticsearch public CA certificate through:

```text
elasticsearch-es-http-certs-public
```

Retrieve the CA certificate:

```bash
kubectl get secret elasticsearch-es-http-certs-public \
  -n logging \
  -o jsonpath='{.data.ca\.crt}' | base64 --decode > ca.crt
```

Create a ConfigMap in the tracing namespace:

```bash
kubectl create configmap jaeger-elasticsearch-ca \
  -n tracing \
  --from-file=ca.crt=ca.crt
```

Verify:

```bash
kubectl get configmap jaeger-elasticsearch-ca -n tracing
```

Remove the temporary local file:

```bash
rm ca.crt
```

On Windows PowerShell:

```powershell
Remove-Item ca.crt
```

The CA certificate itself is not a password, but there is no reason to commit the generated certificate file to the repository.

## 16. Configure Jaeger

The Jaeger Helm configuration is stored at:

```text
helm-values/jaeger-values.yaml
```

The configuration will:

1. Deploy Jaeger.
2. Use Elasticsearch as trace storage.
3. Connect to Elasticsearch over HTTPS.
4. Validate the Elasticsearch CA.
5. Read the Elasticsearch username and password from a Kubernetes Secret.
6. Mount the Elasticsearch CA certificate.
7. Receive OTLP over HTTP on port `4318`.
8. Receive OTLP over gRPC on port `4317`.
9. Expose the Jaeger UI on port `16686`.

The Elasticsearch endpoint is:

```text
https://elasticsearch-es-http.logging.svc.cluster.local:9200
```

The application trace endpoint is:

```text
http://jaeger.tracing.svc.cluster.local:4318/v1/traces
```

The Jaeger UI is available through port `16686`.

## 17. Add the Jaeger Helm Repository

Add the official Jaeger Helm repository:

```bash
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
```

Update Helm repositories:

```bash
helm repo update
```

Check available Jaeger chart versions:

```bash
helm search repo jaegertracing/jaeger --versions
```

Because the Jaeger v2 Helm chart is actively developed, verify the chart version available in your environment before pinning a version.

For this learning project, we can use the currently available chart unless we intentionally decide to pin a specific version.

## 18. Validate the Helm Configuration

Before installing Jaeger, render the Kubernetes manifests:

```bash
helm template jaeger jaegertracing/jaeger \
  -n tracing \
  -f helm-values/jaeger-values.yaml
```

Review the output.

Verify that the generated manifests contain:

* Jaeger Deployment
* Jaeger Service
* Jaeger UI port
* OTLP HTTP port
* OTLP gRPC port
* Elasticsearch configuration
* Elasticsearch Secret references
* Elasticsearch CA volume
* Jaeger storage configuration

Run Helm lint:

```bash
helm lint jaegertracing/jaeger \
  -f helm-values/jaeger-values.yaml
```

If the chart version in your environment differs significantly from the version used while creating this guide, inspect the available values:

```bash
helm show values jaegertracing/jaeger
```

Then compare the `userconfig` structure with:

```text
helm-values/jaeger-values.yaml
```

## 19. Install Jaeger

Install Jaeger:

```bash
helm upgrade --install jaeger jaegertracing/jaeger \
  -n tracing \
  -f helm-values/jaeger-values.yaml
```

Check the Helm release:

```bash
helm list -n tracing
```

Expected:

```text
NAME     NAMESPACE   STATUS
jaeger   tracing     deployed
```

## 20. Verify Jaeger

Check the pods:

```bash
kubectl get pods -n tracing
```

Expected:

```text
NAME                      READY   STATUS    RESTARTS   AGE
jaeger-xxxxxxxxxx-xxxxx   1/1     Running   0          ...
```

Check the Service:

```bash
kubectl get svc -n tracing
```

The Jaeger Service should expose the UI and OTLP ports.

You can verify the exact ports with:

```bash
kubectl get svc jaeger -n tracing
```

Check the deployment:

```bash
kubectl get deployment -n tracing
```

Check the Jaeger logs:

```bash
kubectl logs -n tracing deployment/jaeger
```

If the deployment name differs, first run:

```bash
kubectl get deployments -n tracing
```

Then use the returned deployment name.

## 21. Configure Service A and Service B

This is the main connection between Topic 04 and Topic 06.

The applications already contain OpenTelemetry instrumentation.

The `tracing.js` files from Topic 04 use an environment variable for the OTLP trace endpoint.

The local-development default is:

```text
http://localhost:4318/v1/traces
```

Inside Kubernetes, `localhost` refers to the application container itself.

Therefore, Kubernetes deployments must point to the Jaeger Service.

Use:

```text
http://jaeger.tracing.svc.cluster.local:4318/v1/traces
```

### Service A

Update the Service A Kubernetes Deployment:

```yaml
env:
  - name: OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
    value: "http://jaeger.tracing.svc.cluster.local:4318/v1/traces"
```

### Service B

Update the Service B Kubernetes Deployment:

```yaml
env:
  - name: OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
    value: "http://jaeger.tracing.svc.cluster.local:4318/v1/traces"
```

The existing application code does not need a Jaeger-specific library.

We only change the destination of the OpenTelemetry exporter.

Apply the updated Topic 04 manifests.

For example, from a repository location where the relative path is correct:

```bash
kubectl apply -k ../04-instrumentation-and-custom-metrics/kubernetes-manifest/
```

Use the correct path for your local repository layout.

Verify Service A:

```bash
kubectl exec -n dev deploy/a-service -- \
  printenv OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
```

Expected:

```text
http://jaeger.tracing.svc.cluster.local:4318/v1/traces
```

Verify Service B:

```bash
kubectl exec -n dev deploy/b-service -- \
  printenv OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
```

Expected:

```text
http://jaeger.tracing.svc.cluster.local:4318/v1/traces
```

Verify the deployments rolled out:

```bash
kubectl rollout status deployment/a-service -n dev
kubectl rollout status deployment/b-service -n dev
```

## 22. Generate Tracing Traffic

First verify Service A:

```bash
kubectl get svc a-service -n dev
```

Because Service A is exposed through a LoadBalancer, wait until an external address is available.

```bash
kubectl get svc a-service -n dev
```

The important application endpoints include:

```text
/healthy
/serverError
/notFound
/logs
/example
/metrics
/call-service-b
```

For distributed tracing, use:

```text
/call-service-b
```

This causes:

```text
Service A
    |
    v
Service B
```

Generate several requests.

You can use the Topic 04 traffic-generation script as well.

For example:

```bash
./test.sh
```

Use the exact invocation documented in Topic 04.

## 23. Access the Jaeger UI

The Jaeger Service exposes port `16686` for the UI.

Start port forwarding:

```bash
kubectl port-forward svc/jaeger 16686:16686 -n tracing
```

Expected:

```text
Forwarding from 127.0.0.1:16686 -> 16686
Forwarding from [::1]:16686 -> 16686
```

Open:

```text
http://localhost:16686
```

Keep the port-forward terminal running while using the UI.

## 24. Find Service A Traces

Open the Jaeger UI.

Select the Service dropdown.

After generating traffic, we should see the Service A service name:

```text
instrumentation-service-a
```

Select:

```text
instrumentation-service-a
```

Then select an available operation.

For example:

```text
GET /healthy
```

or:

```text
GET /call-service-b
```

Search for traces.

A trace for `/healthy` may contain several spans generated by the HTTP and Express instrumentation.

For example:

```text
Trace
 |
 +-- HTTP request
 |
 +-- Express middleware
 |
 +-- Express route
 |
 +-- /healthy
```

The exact number and names of spans depend on the OpenTelemetry instrumentation and application execution path.

## 25. Trace Service A to Service B

Now generate:

```text
/call-service-b
```

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
   |
   | /hello
   v
Response
```

Open the corresponding trace in Jaeger.

The trace should contain operations from both services.

Conceptually:

```text
Trace
 |
 +-- instrumentation-service-a
 |      |
 |      +-- /call-service-b
 |             |
 |             +-- HTTP client request
 |
 +-- instrumentation-service-b
        |
        +-- /hello
```

This is the main distributed tracing demonstration for Topic 06.

The important part is that Service A and Service B are connected through trace context propagation.

## 26. Understand the Trace Timeline

When a trace is opened, Jaeger displays a timeline of spans.

A simplified example:

```text
0 ms
|
+-- Service A /call-service-b -------------------- 80 ms
|       |
|       +-- HTTP client request ------------------- 60 ms
|                 |
|                 +-- Service B /hello ------------ 25 ms
|
+-------------------------------------------------------
                                                   80 ms
```

Each span contains timing information.

We can investigate:

* Which service started the operation?
* Which downstream service was called?
* How long did the operation take?
* Which span consumed most of the request time?
* Did an error occur?
* What attributes were attached to the span?
* What is the parent-child relationship?

This makes distributed tracing useful for latency investigation.

## 27. Troubleshooting with Tracing

Suppose a user reports:

```text
The application is taking too long to respond.
```

Metrics might show:

```text
HTTP latency = 4 seconds
```

Logs might show:

```text
Service A received request
Service B received request
Service B completed request
```

Tracing can connect the complete request:

```text
Service A
   |
   | 100 ms
   v
Service B
   |
   | 3.2 sec
   v
External dependency
   |
   | 500 ms
   v
Response
```

Now we know which span deserves investigation.

A practical troubleshooting workflow is:

```text
Alert / User Report
        |
        v
Metrics
        |
        v
Identify high latency
        |
        v
Find trace
        |
        v
Identify slow span
        |
        v
Correlate with logs
        |
        v
Investigate application/dependency
        |
        v
Fix and validate
```

This demonstrates how metrics, logs, and traces complement each other.

## 28. Troubleshooting

### Problem 1: No services appear in Jaeger

Check Service A:

```bash
kubectl get pods -n dev
```

Check the OTLP endpoint:

```bash
kubectl exec -n dev deploy/a-service -- \
  printenv OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
```

It should be:

```text
http://jaeger.tracing.svc.cluster.local:4318/v1/traces
```

Check Jaeger:

```bash
kubectl get pods -n tracing
```

Check Jaeger logs:

```bash
kubectl logs -n tracing deployment/jaeger
```

Generate fresh application traffic.

### Problem 2: Jaeger is running but Elasticsearch connection fails

Check Elasticsearch:

```bash
kubectl get pods -n logging
```

Check the Elasticsearch Service:

```bash
kubectl get svc elasticsearch-es-http -n logging
```

Check Jaeger logs:

```bash
kubectl logs -n tracing deployment/jaeger
```

Look for messages related to:

```text
Elasticsearch
TLS
authentication
connection
certificate
```

### Problem 3: Elasticsearch TLS certificate verification fails

Check the ConfigMap:

```bash
kubectl get configmap jaeger-elasticsearch-ca -n tracing
```

Describe it:

```bash
kubectl describe configmap jaeger-elasticsearch-ca -n tracing
```

Check the Jaeger pod:

```bash
kubectl exec -n tracing deployment/jaeger -- \
  ls -l /tls
```

The CA certificate should be available.

Do not disable TLS certificate verification as the normal solution.

### Problem 4: Elasticsearch authentication fails

Verify the Secret exists:

```bash
kubectl get secret jaeger-elasticsearch-credentials -n tracing
```

If the Elasticsearch password was changed after the Jaeger Secret was created, recreate the Secret.

Retrieve the current password:

```bash
ELASTIC_PASSWORD=$(kubectl get secret elasticsearch-es-elastic-user \
  -n logging \
  -o jsonpath='{.data.elastic}' | base64 --decode)
```

Delete the old Secret:

```bash
kubectl delete secret jaeger-elasticsearch-credentials -n tracing
```

Create it again:

```bash
kubectl create secret generic jaeger-elasticsearch-credentials \
  -n tracing \
  --from-literal=username=elastic \
  --from-literal=password="${ELASTIC_PASSWORD}"
```

Restart Jaeger:

```bash
kubectl rollout restart deployment/jaeger -n tracing
```

Verify:

```bash
kubectl rollout status deployment/jaeger -n tracing
```

### Problem 5: Jaeger UI does not open

Check the pod:

```bash
kubectl get pods -n tracing
```

Check the Service:

```bash
kubectl get svc jaeger -n tracing
```

Start port forwarding again:

```bash
kubectl port-forward svc/jaeger 16686:16686 -n tracing
```

Open:

```text
http://localhost:16686
```

### Problem 6: Service A appears but Service B does not

Check the Service A downstream URL:

```bash
kubectl exec -n dev deploy/a-service -- \
  printenv SERVICE_B_URI
```

It should point to Service B.

For Topic 04 this is:

```text
http://b-service.dev
```

Check Service B:

```bash
kubectl get pods -n dev
kubectl get svc b-service -n dev
```

Check Service B logs:

```bash
kubectl logs -n dev deploy/b-service
```

Verify the Service B OTLP endpoint:

```bash
kubectl exec -n dev deploy/b-service -- \
  printenv OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
```

Expected:

```text
http://jaeger.tracing.svc.cluster.local:4318/v1/traces
```

### Problem 7: Service A and Service B appear as separate traces

Check that both applications are using OpenTelemetry instrumentation.

Verify:

```bash
kubectl exec -n dev deploy/a-service -- \
  printenv OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
```

and:

```bash
kubectl exec -n dev deploy/b-service -- \
  printenv OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
```

Then generate a new `/call-service-b` request.

Also verify that Service A is actually calling Service B:

```bash
kubectl logs -n dev deploy/a-service
```

and:

```bash
kubectl logs -n dev deploy/b-service
```

The OpenTelemetry instrumentation must be loaded before the HTTP client and Express application are initialized.

This is already handled in the Topic 04 `tracing.js` implementation.

### Problem 8: Traces are not immediately visible

Generate several requests:

```text
/healthy
/call-service-b
```

Then refresh the Jaeger search.

Check Jaeger logs:

```bash
kubectl logs -n tracing deployment/jaeger
```

Check the application pods:

```bash
kubectl get pods -n dev
```

Check the Jaeger pod:

```bash
kubectl get pods -n tracing
```

Also verify that the Jaeger pod can reach Elasticsearch through the Kubernetes Service.

## 29. Validation Checklist

Use this checklist before considering Topic 06 complete.

### Kubernetes

```bash
kubectl get nodes
kubectl get ns
```

### Application

```bash
kubectl get pods -n dev
kubectl get svc -n dev
```

### Elasticsearch

```bash
kubectl get pods -n logging
kubectl get svc elasticsearch-es-http -n logging
```

### Jaeger

```bash
kubectl get pods -n tracing
kubectl get svc -n tracing
helm list -n tracing
```

### Elasticsearch Credentials

```bash
kubectl get secret jaeger-elasticsearch-credentials -n tracing
```

### Elasticsearch CA

```bash
kubectl get configmap jaeger-elasticsearch-ca -n tracing
```

### OpenTelemetry Endpoint

Service A:

```bash
kubectl exec -n dev deploy/a-service -- \
  printenv OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
```

Service B:

```bash
kubectl exec -n dev deploy/b-service -- \
  printenv OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
```

Both should point to:

```text
http://jaeger.tracing.svc.cluster.local:4318/v1/traces
```

### Application Traffic

Generate:

```text
/healthy
```

and:

```text
/call-service-b
```

### Jaeger UI

Run:

```bash
kubectl port-forward svc/jaeger 16686:16686 -n tracing
```

Open:

```text
http://localhost:16686
```

Verify that:

```text
instrumentation-service-a
instrumentation-service-b
```

appear after generating traffic.

Verify that the `/call-service-b` trace contains operations from both services.

## 30. Cleanup

Jaeger is installed through Helm.

Uninstall Jaeger:

```bash
helm uninstall jaeger -n tracing
```

Delete the tracing namespace:

```bash
kubectl delete namespace tracing
```

This removes the Topic 06 Jaeger resources, including:

* Jaeger Deployment
* Jaeger Service
* Jaeger ConfigMap
* Jaeger Secret
* Jaeger-related resources in the `tracing` namespace

### Restore Topic 04 application configuration

If the OTLP endpoint was added specifically for this lab, remove the Jaeger endpoint from the Topic 04 Deployment manifests when you no longer need tracing.

Then reapply the Topic 04 manifests.

For example:

```bash
kubectl apply -k ../04-instrumentation-and-custom-metrics/kubernetes-manifest/
```

Use the correct repository-relative path for your local checkout.

### Elasticsearch

Do not uninstall Elasticsearch during the normal Topic 06 cleanup.

Elasticsearch is shared with Topic 05.

Only remove Elasticsearch when intentionally cleaning up the complete observability environment.

### EKS Cluster

Do not delete the EKS cluster during the normal Topic 06 cleanup.

The EKS cluster is shared by the observability topics.

## 31. Important Notes

### Jaeger v2

This project uses Jaeger v2.

Older tutorials may show:

```text
Jaeger Agent
Jaeger Collector
Jaeger Query
Jaeger Ingester
```

Do not copy those older Helm configurations directly into this project.

The Jaeger v2 Helm chart uses a unified deployment model based on the OpenTelemetry Collector framework.

### OpenTelemetry

The applications use OpenTelemetry for tracing instrumentation and OTLP trace export.

We do not add Jaeger-specific instrumentation libraries to the Node.js applications.

This keeps application instrumentation vendor-neutral.

### No hard-coded Elasticsearch password

Never commit credentials such as:

```yaml
password: my-password
```

to GitHub.

The Elasticsearch password is provided to Jaeger through a Kubernetes Secret.

### Elasticsearch is reused

Topic 05 already provides Elasticsearch.

Topic 06 uses that Elasticsearch instance for trace storage.

The resulting observability architecture is:

```text
                    EKS Cluster
                         |
       +-----------------+-----------------+
       |                 |                 |
       v                 v                 v
    Metrics             Logs             Traces
       |                 |                 |
       v                 v                 v
 Prometheus          Fluent Bit      OpenTelemetry
       |                 |                 |
       v                 v                 v
    Grafana         Elasticsearch         Jaeger
                         |                 |
                         |                 |
                         +--------+--------+
                                  |
                           Jaeger UI / Kibana
```

The individual signal paths are:

```text
Metrics:
Prometheus -> Grafana

Logs:
Fluent Bit -> Elasticsearch -> Kibana

Traces:
OpenTelemetry -> Jaeger -> Elasticsearch -> Jaeger UI
```

The important point is that the same Elasticsearch deployment can support multiple observability workloads while the collection and visualization paths remain separate.
