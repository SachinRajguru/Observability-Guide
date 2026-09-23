
## Logging with EFK

> > **File:** `01-logging-with-efk.md`

Structured execution guide for developers, DevOps, SRE, and infrastructure engineers covering centralized Kubernetes logging with Elasticsearch, Fluent Bit, and Kibana.

## Table of Contents

1. [Explore the Purpose of Logging](#1-explore-the-purpose-of-logging)
2. [Explore the Centralized Logging Problem](#2-explore-the-centralized-logging-problem)
3. [Explore the EFK Stack](#3-explore-the-efk-stack)
4. [Explore the Architecture](#4-explore-the-architecture)
5. [Explore the Difference Between EFK and ELK](#5-explore-the-difference-between-efk-and-elk)
6. [Explore the Kubernetes Logging Flow](#6-explore-the-kubernetes-logging-flow)
7. [Prerequisites](#7-prerequisites)
8. [Explore Persistent Storage](#8-explore-persistent-storage)
9. [Explore the EBS CSI Driver](#9-explore-the-ebs-csi-driver)
10. [Create the IAM Service Account](#10-create-the-iam-service-account)
11. [Retrieve the IAM Role ARN](#11-retrieve-the-iam-role-arn)
12. [Deploy or Configure the EBS CSI Add-on](#12-deploy-or-configure-the-ebs-csi-add-on)
13. [Create the Logging Namespace](#13-create-the-logging-namespace)
14. [Explore Elasticsearch Deployment](#14-explore-elasticsearch-deployment)
15. [Install ECK](#15-install-eck)
16. [Deploy Elasticsearch and Kibana](#16-deploy-elasticsearch-and-kibana)
17. [Explore Elasticsearch Credentials](#17-explore-elasticsearch-credentials)
18. [Explore Kibana](#18-explore-kibana)
19. [Explore Fluent Bit](#19-explore-fluent-bit)
20. [Explore the Fluent Bit Configuration](#20-explore-the-fluent-bit-configuration)
21. [Service Configuration](#21-service-configuration)
22. [Explore the Container Log Input](#22-explore-the-container-log-input)
23. [Explore Kubernetes Metadata Enrichment](#23-explore-kubernetes-metadata-enrichment)
24. [Explore Namespace Filtering](#24-explore-namespace-filtering)
25. [Explore the Elasticsearch Output](#25-explore-the-elasticsearch-output)
26. [Install Fluent Bit](#26-install-fluent-bit)
27. [Verify Fluent Bit](#27-verify-fluent-bit)
28. [Explore Fluent Bit Logs](#28-explore-fluent-bit-logs)
29. [Deploy an Application for Testing](#29-deploy-an-application-for-testing)
30. [Explore Application Logs Directly](#30-explore-application-logs-directly)
31. [Generate Additional Application Traffic](#31-generate-additional-application-traffic)
32. [Verify Fluent Bit Is Collecting the Logs](#32-verify-fluent-bit-is-collecting-the-logs)
33. [Explore Elasticsearch Data](#33-explore-elasticsearch-data)
34. [Explore Kibana Data Views](#34-explore-kibana-data-views)
35. [Explore Logs in Kibana](#35-explore-logs-in-kibana)
36. [Explore Log Filtering](#36-explore-log-filtering)
37. [Explore the Complete Pipeline](#37-explore-the-complete-pipeline)
38. [Troubleshooting](#38-troubleshooting)
39. [Explore Useful Verification Commands](#39-explore-useful-verification-commands)
40. [Explore What We Learned](#40-explore-what-we-learned)
41. [Cleanup](#41-cleanup)
42. [AWS Cleanup](#42-aws-cleanup)
43. [Final Validation Checklist](#43-final-validation-checklist)
44. [Official Documentation](#44-official-documentation)

## 1. Explore the Purpose of Logging

Logging is one of the three primary observability signals:

```text
Observability
│
├── Metrics  → What is happening?
├── Logs     → What happened and why?
└── Traces   → How did the request move through the system?
```

Metrics are useful for identifying changes in system behavior.

Logs provide detailed event information that helps us investigate those changes.

For example:

```text
Metric:
HTTP 5xx errors increased.

Log:
Database connection timeout while processing request.
```

The metric tells us that an error condition exists.

The log provides additional context that can help us investigate the cause.

## 2. Explore the Centralized Logging Problem

Suppose a Kubernetes cluster contains:

```text
Namespace A
 ├── service-a
 ├── service-b
 └── service-c

Namespace B
 ├── service-d
 ├── service-e
 └── service-f

Namespace C
 ├── service-g
 ├── service-h
 └── service-i
```

Without centralized logging, we may need to inspect individual pods:

```bash
kubectl logs <pod-name> -n <namespace>
```

As the number of services grows, this becomes difficult to operate.

A centralized logging architecture provides:

```text
Many Applications
       │
       ▼
Central Log Collector
       │
       ▼
Central Log Store
       │
       ▼
Search / Visualization
```

This allows us to search logs across multiple applications and namespaces from one location.

## 3. Explore the EFK Stack

EFK stands for:

```text
E = Elasticsearch
F = Fluent Bit
K = Kibana
```

The responsibilities are:

### Elasticsearch

Stores and indexes log records.

### Fluent Bit

Collects logs from Kubernetes nodes and forwards them to Elasticsearch.

### Kibana

Provides a web interface for searching and analyzing logs stored in Elasticsearch.

## 4. Explore the Architecture

```text
                        Kubernetes Cluster
                                │
             ┌──────────────────┴──────────────────┐
             │                                     │
       Worker Node 1                         Worker Node 2
             │                                     │
      ┌──────┴──────┐                       ┌──────┴──────┐
      │             │                       │             │
    Pod A         Pod B                   Pod C         Pod D
      │             │                       │             │
      └──────┬──────┘                       └──────┬──────┘
             │                                     │
             ▼                                     ▼
       Container Logs                        Container Logs
             │                                     │
             └──────────────────┬──────────────────┘
                                │
                                ▼
                            Fluent Bit
                            DaemonSet
                                │
                                │
                                ▼
                          Elasticsearch
                                │
                                │
                                ▼
                              Kibana
```

Fluent Bit is deployed as a DaemonSet so that each Kubernetes worker node can have a Fluent Bit instance responsible for collecting logs available on that node.

## 5. Explore the Difference Between EFK and ELK

Two common logging stacks are:

```text
EFK
Elasticsearch
Fluent Bit
Kibana
```

and:

```text
ELK
Elasticsearch
Logstash
Kibana
```

Elasticsearch and Kibana are common to both architectures.

The primary difference is the log-processing component.

### Fluent Bit

Fluent Bit is designed to be lightweight and is commonly used as a log collector and forwarder.

### Logstash

Logstash provides a broader processing pipeline with extensive filtering and transformation capabilities.

For this project we use Fluent Bit because the objective is to understand Kubernetes log collection and centralized log forwarding without introducing an unnecessarily large processing layer.

## 6. Explore the Kubernetes Logging Flow

Applications running in containers commonly write logs to:

```text
stdout
stderr
```

Kubernetes/container runtime logging makes these records available on the worker node.

Fluent Bit reads the container log files from the node.

The configuration used in this project reads:

```text
/var/log/containers/*.log
```

The overall flow becomes:

```text
Application
    │
    ▼
stdout / stderr
    │
    ▼
Container runtime log
    │
    ▼
/var/log/containers/
    │
    ▼
Fluent Bit
```

## 7. Prerequisites

Before starting, verify that the following tools are available:

```bash
kubectl version --client
helm version
aws --version
eksctl version
```

Verify the current Kubernetes context:

```bash
kubectl config current-context
```

Verify cluster access:

```bash
kubectl get nodes
```

Expected output should show the worker nodes associated with the current cluster.

Also verify that the AWS CLI is authenticated:

```bash
aws sts get-caller-identity
```

## 8. Explore Persistent Storage

Elasticsearch stores log data.

Because logs need to survive pod restarts, Elasticsearch should use persistent storage rather than relying only on the container filesystem.

For an Amazon EKS environment, Amazon EBS can provide persistent block storage.

The architecture is:

```text
Elasticsearch Pod
       │
       ▼
PersistentVolumeClaim
       │
       ▼
EBS CSI Driver
       │
       ▼
Amazon EBS Volume
```

The EBS CSI driver allows Kubernetes to provision and attach EBS volumes for workloads that request compatible persistent storage.

## 9. Explore the EBS CSI Driver

The EBS CSI driver requires AWS permissions to manage EBS resources.

For an EKS cluster, the recommended identity model is to associate the driver's Kubernetes service account with an AWS IAM role.

Conceptually:

```text
Kubernetes ServiceAccount
          │
          ▼
       IAM Role
          │
          ▼
EBS CSI Driver
          │
          ▼
     Amazon EBS
```

First identify the cluster:

```bash
aws eks list-clusters --output table
```

Set the cluster name:

```bash
export CLUSTER_NAME="observability"
```

If your cluster uses a different name, replace the value.

## 10. Create the IAM Service Account

Create the EBS CSI IAM service account:

```bash
eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster "$CLUSTER_NAME" \
  --role-name AmazonEKS_EBS_CSI_DriverRole \
  --role-only \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve
```

Verify the service account:

```bash
kubectl get serviceaccount ebs-csi-controller-sa -n kube-system
```

## 11. Retrieve the IAM Role ARN

```bash
ARN=$(aws iam get-role \
  --role-name AmazonEKS_EBS_CSI_DriverRole \
  --query 'Role.Arn' \
  --output text)
```

Verify:

```bash
echo "$ARN"
```

## 12. Deploy or Configure the EBS CSI Add-on

If the EBS CSI add-on is not already installed:

```bash
eksctl create addon \
  --cluster "$CLUSTER_NAME" \
  --name aws-ebs-csi-driver \
  --service-account-role-arn "$ARN" \
  --force
```

Verify the add-on:

```bash
aws eks describe-addon \
  --cluster "$CLUSTER_NAME" \
  --addon-name aws-ebs-csi-driver
```

Verify its Kubernetes resources:

```bash
kubectl get pods -n kube-system | grep ebs-csi
```

## 13. Create the Logging Namespace

```bash
kubectl create namespace logging
```

If the namespace already exists:

```bash
kubectl get namespace logging
```

## 14. Explore Elasticsearch Deployment

For current Elastic Kubernetes deployments, Elastic provides ECK-based deployment mechanisms for Elasticsearch and Kibana.

Add the Elastic Helm repository:

```bash
helm repo add elastic https://helm.elastic.co
helm repo update
```

Verify available charts:

```bash
helm search repo elastic
```

For this project, use the ECK stack approach rather than committing to the older standalone Elasticsearch/Kibana chart pattern.

## 15. Install ECK

Create the ECK namespace:

```bash
kubectl create namespace elastic-system
```

Install the ECK operator:

```bash
helm install elastic-operator \
  elastic/eck-operator \
  -n elastic-system \
  --create-namespace
```

Verify:

```bash
kubectl get pods -n elastic-system
```

Wait until the operator becomes ready.

## 16. Deploy Elasticsearch and Kibana

Create a working values file for the Elastic stack.

Example:

```yaml
eck-elasticsearch:
  nodeSets:
    - name: default
      count: 1

      volumeClaimTemplates:
        - metadata:
            name: elasticsearch-data
          spec:
            accessModes:
              - ReadWriteOnce
            resources:
              requests:
                storage: 20Gi

eck-kibana:
  count: 1
  http:
    service:
      spec:
        type: LoadBalancer
```

Save this as:

```text
elastic-stack-values.yaml
```

Then install:

```bash
helm install logging-stack \
  elastic/eck-stack \
  -n logging \
  --create-namespace \
  -f elastic-stack-values.yaml
```

Check Helm:

```bash
helm list -n logging
```

Check Elasticsearch:

```bash
kubectl get elasticsearch -n logging
```

Check Kibana:

```bash
kubectl get kibana -n logging
```

Check pods:

```bash
kubectl get pods -n logging
```

## 17. Explore Elasticsearch Credentials

Do not store Elasticsearch passwords in Git.

The credentials should remain in Kubernetes Secrets.

Inspect available secrets:

```bash
kubectl get secrets -n logging
```

For an ECK-managed Elasticsearch deployment, inspect the generated Elasticsearch credentials Secret:

```bash
kubectl get secrets -n logging
```

Identify the appropriate Secret generated for the Elasticsearch deployment.

Retrieve a password only when required:

```bash
kubectl get secret <elasticsearch-credentials-secret> \
  -n logging \
  -o jsonpath='{.data.elastic}' | base64 -d
```

Do not copy the resulting password into:

```text
README.md
fluentbit-values.yaml
Git commits
GitHub
screenshots
```

## 18. Explore Kibana

Retrieve the Kibana service:

```bash
kubectl get svc -n logging
```

If the service is configured as a LoadBalancer:

```bash
kubectl get svc -n logging
```

Wait for the external address:

```text
EXTERNAL-IP
```

Kibana normally listens on:

```text
5601
```

Open the provided external address in a browser.

## 19. Explore Fluent Bit

Fluent Bit will act as the collection layer.

The desired architecture is:

```text
Kubernetes Node
      │
      ▼
Fluent Bit
      │
      ├── Input
      ├── Filter
      └── Output
             │
             ▼
        Elasticsearch
```

The four important Fluent Bit configuration concepts are:

```text
Service
Input
Filter
Output
```

## 20. Explore the Fluent Bit Configuration

The repository contains:

```text
fluentbit-values.yaml
```

The file configures Fluent Bit as a DaemonSet.

Important sections include:

```text
service
inputs
filters
outputs
```

## 21. Service Configuration

The Service section controls Fluent Bit's runtime behavior.

Example:

```ini
[SERVICE]
    Daemon Off
    Flush 1
    Log_Level info
    Parsers_File /fluent-bit/etc/parsers.conf
    Parsers_File /fluent-bit/etc/conf/custom_parsers.conf
    HTTP_Server On
    HTTP_Listen 0.0.0.0
    HTTP_Port 2020
    Health_Check On
```

The HTTP endpoint can be used for Fluent Bit health and metrics information.

## 22. Explore the Container Log Input

The primary input is:

```ini
[INPUT]
    Name tail
    Path /var/log/containers/*.log
    multiline.parser docker, cri
    Tag kube.*
    Mem_Buf_Limit 5MB
    Skip_Long_Lines On
```

Important settings:

### `Name tail`

Reads log files as they are appended.

### `Path`

Identifies Kubernetes container log files.

### `Tag kube.*`

Associates the records with a Kubernetes-related tag.

### `multiline.parser`

Allows Fluent Bit to handle supported multi-line container log formats.

## 23. Explore Kubernetes Metadata Enrichment

Use the Kubernetes filter:

```ini
[FILTER]
    Name kubernetes
    Match kube.*
    Merge_Log On
    Keep_Log Off
    K8S-Logging.Parser On
    K8S-Logging.Exclude On
```

This allows Fluent Bit to enrich records with Kubernetes metadata.

Examples include:

```text
namespace
pod
container
labels
```

This metadata makes centralized log searches much more useful.

## 24. Explore Namespace Filtering

This project can exclude logs generated by the logging infrastructure itself.

A Lua filter can be used for this purpose.

Conceptually:

```text
if namespace == logging
    skip record
```

This prevents the logging stack from unnecessarily collecting its own internal logs when the objective is to investigate application workloads.

The exact Lua implementation is kept in:

```text
fluentbit-values.yaml
```

## 25. Explore the Elasticsearch Output

The Fluent Bit output sends collected logs to Elasticsearch.

Conceptually:

```ini
[OUTPUT]
    Name es
    Match kube.*
    Host <elasticsearch-service>
    Port 9200
    HTTP_User elastic
    HTTP_Passwd ${ELASTICSEARCH_PASSWORD}
    tls On
    Logstash_Format On
    Retry_Limit False
```

Do not hard-code:

```text
HTTP_Passwd
```

with a real password.

Credentials should be supplied through Kubernetes Secret-backed environment variables or another supported secret mechanism.

## 26. Install Fluent Bit

Add the Fluent Bit Helm repository:

```bash
helm repo add fluent https://fluent.github.io/helm-charts
helm repo update
```

Inspect the chart:

```bash
helm search repo fluent/fluent-bit
```

Inspect available values:

```bash
helm show values fluent/fluent-bit > fluent-bit-default-values.yaml
```

Install using the project configuration:

```bash
helm install fluent-bit \
  fluent/fluent-bit \
  -n logging \
  -f fluentbit-values.yaml
```

## 27. Verify Fluent Bit

Check the DaemonSet:

```bash
kubectl get daemonset -n logging
```

Check pods:

```bash
kubectl get pods -n logging -o wide
```

Because Fluent Bit runs as a DaemonSet, the number of Fluent Bit pods should correspond to the nodes selected by the DaemonSet.

Check:

```bash
kubectl get nodes
```

and:

```bash
kubectl get pods -n logging -o wide
```

## 28. Explore Fluent Bit Logs

Select a Fluent Bit pod:

```bash
kubectl get pods -n logging
```

Then:

```bash
kubectl logs <fluent-bit-pod> -n logging
```

Look for:

```text
input initialization
filter initialization
output initialization
Elasticsearch connection
record processing
```

If Fluent Bit cannot connect to Elasticsearch, investigate:

```text
service name
port
credentials
TLS configuration
network connectivity
```

## 29. Deploy an Application for Testing

The previous topic contains Kubernetes applications that can generate application logs.

Use the existing application deployment from:

```text
04-instrumentation-and-custom-metrics/
```

For example:

```bash
kubectl get pods -n dev
```

If the namespace does not exist:

```bash
kubectl create namespace dev
```

Deploy the application using the manifests from the previous topic.

Then verify:

```bash
kubectl get pods -n dev
```

## 30. Explore Application Logs Directly

Before checking centralized logging, verify that Kubernetes itself has the application logs.

```bash
kubectl logs <pod-name> -n dev
```

You should see application output.

This gives us the baseline:

```text
Application
     │
     ▼
kubectl logs
     │
     ▼
Kubernetes log stream
```

The objective is now to make the same logs available through:

```text
Fluent Bit
     │
     ▼
Elasticsearch
     │
     ▼
Kibana
```

## 31. Generate Additional Application Traffic

Use the traffic-generation script from the previous topic where appropriate.

For example:

```bash
./test.sh <LOAD_BALANCER_ADDRESS>
```

This generates requests against the application and therefore creates additional log records.

Verify that the application is producing logs:

```bash
kubectl logs <pod-name> -n dev --tail=50
```

## 32. Verify Fluent Bit Is Collecting the Logs

Inspect Fluent Bit logs:

```bash
kubectl logs <fluent-bit-pod> -n logging
```

Look for evidence that records from the application namespace are being processed.

If Fluent Bit is running on multiple nodes, remember that the application pod's logs are collected by the Fluent Bit instance running on the node where that application pod is scheduled.

## 33. Explore Elasticsearch Data

Verify Elasticsearch resources:

```bash
kubectl get pods -n logging
```

Verify services:

```bash
kubectl get svc -n logging
```

If necessary, port-forward Elasticsearch for local troubleshooting:

```bash
kubectl port-forward \
  svc/<elasticsearch-service> \
  9200:9200 \
  -n logging
```

Then test:

```bash
curl -k https://localhost:9200
```

Authentication will be required when security is enabled.

## 34. Explore Kibana Data Views

Open Kibana.

Navigate to the area for creating a data view.

Identify the index pattern created by the logging pipeline.

Depending on the output configuration, the indexes may follow a pattern such as:

```text
logstash-*
```

or another project-specific pattern.

Select the appropriate timestamp field if Kibana asks for one.

Save the data view.

## 35. Explore Logs in Kibana

Open the Kibana log-discovery interface.

You should now be able to search logs collected from Kubernetes workloads.

Useful fields include:

```text
namespace
pod
container
host
message
timestamp
```

## 36. Explore Log Filtering

Centralized logging becomes useful when we can narrow the search.

For example, filter by namespace:

```text
namespace = dev
```

Filter by pod:

```text
pod = service-a-...
```

Filter by container:

```text
container = service-a
```

Search for an application message:

```text
database
```

or:

```text
error
```

or:

```text
timeout
```

The exact Kibana Query Language syntax depends on the fields generated by the logging pipeline.

## 37. Explore the Complete Pipeline

At this point the complete flow should be:

```text
┌───────────────────────────┐
│ Kubernetes Application    │
│                           │
│ Service A / Service B     │
└─────────────┬─────────────┘
              │
              │ stdout / stderr
              ▼
┌───────────────────────────┐
│ Kubernetes Node           │
│                           │
│ /var/log/containers/*.log │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Fluent Bit                │
│                           │
│ Input → Filter → Output   │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Elasticsearch             │
│                           │
│ Store + Index + Search    │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Kibana                    │
│                           │
│ Search + Explore          │
└───────────────────────────┘
```

## 38. Troubleshooting

### Fluent Bit pods are not running

Check:

```bash
kubectl get pods -n logging
```

Then:

```bash
kubectl describe pod <fluent-bit-pod> -n logging
```

Check:

```text
events
image
permissions
volume mounts
configuration
```

### Fluent Bit cannot read container logs

Check the DaemonSet:

```bash
kubectl get daemonset fluent-bit -n logging -o yaml
```

Verify that the required host paths are mounted.

The collector needs access to the node log directories.

### Elasticsearch is unavailable

Check:

```bash
kubectl get pods -n logging
```

Then:

```bash
kubectl describe pod <elasticsearch-pod> -n logging
```

Check persistent volume resources:

```bash
kubectl get pvc -n logging
kubectl get pv
```

### PVC remains Pending

Check:

```bash
kubectl get pvc -n logging
```

Then:

```bash
kubectl describe pvc <pvc-name> -n logging
```

Check the storage classes:

```bash
kubectl get storageclass
```

Verify that the EBS CSI driver is installed:

```bash
kubectl get pods -n kube-system | grep ebs-csi
```

### Fluent Bit cannot authenticate to Elasticsearch

Verify:

```text
Elasticsearch username
Elasticsearch password
service name
port
TLS configuration
```

Do not solve this by committing a password to Git.

### Kibana shows no application logs

Check the pipeline in order:

```text
Application logs
      ↓
kubectl logs
      ↓
Fluent Bit
      ↓
Elasticsearch
      ↓
Kibana
```

Start at the first failing stage.

First:

```bash
kubectl logs <application-pod> -n dev
```

Then:

```bash
kubectl logs <fluent-bit-pod> -n logging
```

Then verify Elasticsearch indexes.

Finally check the Kibana data view and time range.

## 39. Explore Useful Verification Commands

### Kubernetes

```bash
kubectl get nodes
kubectl get pods -n logging
kubectl get svc -n logging
kubectl get pvc -n logging
kubectl get pv
```

### Helm

```bash
helm list -n logging
helm status logging-stack -n logging
helm status fluent-bit -n logging
```

### Fluent Bit

```bash
kubectl get daemonset -n logging
kubectl logs <fluent-bit-pod> -n logging
```

### Application

```bash
kubectl get pods -n dev
kubectl logs <application-pod> -n dev
```

## 40. Explore What We Learned

We now understand:

* why centralized logging is needed
* how Kubernetes produces container logs
* how Fluent Bit collects those logs
* why Fluent Bit is deployed as a DaemonSet
* how Kubernetes metadata enriches records
* how filters can remove unwanted records
* how Elasticsearch stores and indexes logs
* how persistent storage protects Elasticsearch data
* how Kibana provides log exploration
* how application logs move through the EFK pipeline
* how to troubleshoot each stage

## 41. Cleanup

Before cleanup, identify the resources created specifically for this topic.

Check Helm releases:

```bash
helm list -n logging
```

Uninstall Fluent Bit:

```bash
helm uninstall fluent-bit -n logging
```

Remove the Elastic stack:

```bash
helm uninstall logging-stack -n logging
```

If ECK was installed specifically for this project:

```bash
helm uninstall elastic-operator -n elastic-system
```

Remove the namespaces when they are no longer required:

```bash
kubectl delete namespace logging
kubectl delete namespace elastic-system
```

If the test application was created only for this topic:

```bash
kubectl delete namespace dev
```

Do not delete the `dev` namespace if it is still required by another observability project.

## 42. AWS Cleanup

If the EBS CSI IAM service account and IAM role were created specifically for this lab, remove them after verifying that no other workload depends on them.

For example:

```bash
eksctl delete iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster "$CLUSTER_NAME"
```

Do not remove the cluster-wide EBS CSI add-on if other workloads in the EKS cluster depend on it.

## 43. Final Validation Checklist

Before considering the topic complete:

```text
[ ] Kubernetes cluster accessible
[ ] EBS CSI driver available
[ ] logging namespace created
[ ] ECK operator installed
[ ] Elasticsearch running
[ ] Elasticsearch persistent storage configured
[ ] Kibana running
[ ] Kibana externally accessible
[ ] Fluent Bit installed
[ ] Fluent Bit running as DaemonSet
[ ] Container log input configured
[ ] Kubernetes metadata filter configured
[ ] Unwanted namespace filtering configured
[ ] Elasticsearch output configured
[ ] Credentials protected
[ ] Application deployed
[ ] Application logs visible with kubectl
[ ] Fluent Bit receiving logs
[ ] Elasticsearch receiving logs
[ ] Kibana data view created
[ ] Application logs searchable in Kibana
[ ] Troubleshooting validated
[ ] Cleanup understood
```

## 44. Official Documentation

Use the official documentation when extending this lab:

* Kubernetes documentation
* Helm documentation
* Fluent Bit documentation
* Elastic documentation
* Elastic Cloud on Kubernetes documentation
* Amazon EKS documentation
* Amazon EBS CSI Driver documentation

The versions and chart configuration available in the environment should always be checked before deploying a new lab because Helm charts and Kubernetes integrations evolve over time.
