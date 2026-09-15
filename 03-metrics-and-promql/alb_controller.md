
## AWS Load Balancer Controller Installation

> **File:** `alb_controller.md`

> **Platform:** AWS EKS / Kubernetes
>
> **Focus:** AWS Load Balancer Controller installation and ALB integration
>
> **Level:** Practical / Intermediate

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Step 1 — Download the IAM Policy](#4-step-1--download-the-iam-policy)
5. [Step 2 — Create the IAM Policy](#5-step-2--create-the-iam-policy)
6. [Step 3 — Create the Kubernetes Service Account and IAM Role](#6-step-3--create-the-kubernetes-service-account-and-iam-role)
7. [Step 4 — Add the AWS EKS Helm Repository](#7-step-4--add-the-aws-eks-helm-repository)
8. [Step 5 — Install the AWS Load Balancer Controller](#8-step-5--install-the-aws-load-balancer-controller)
9. [Step 6 — Verify the Installation](#9-step-6--verify-the-installation)
10. [Troubleshooting](#10-troubleshooting)
11. [Cleanup](#11-cleanup)
12. [Key Takeaways](#12-key-takeaways)

## 1. Overview

The **AWS Load Balancer Controller** is a Kubernetes controller that manages AWS Elastic Load Balancers for Kubernetes workloads.

It can provision and manage:

* Application Load Balancers (ALBs)
* Network Load Balancers (NLBs)

In this observability lab, an **Application Load Balancer (ALB)** is used to expose monitoring interfaces such as Prometheus, Grafana, and Alertmanager through Kubernetes Ingress resources.

The controller watches Kubernetes resources and reconciles the corresponding AWS load-balancing resources.

A simplified relationship is:

```text
Kubernetes Ingress
        │
        ▼
AWS Load Balancer Controller
        │
        │ Provisions / configures
        ▼
AWS Application Load Balancer
        │
        ▼
Kubernetes Service
        │
        ▼
Pod
```

The controller therefore provides the integration layer between Kubernetes networking resources and AWS load-balancing services.

## 2. Architecture

The AWS Load Balancer Controller runs inside the EKS cluster and continuously watches relevant Kubernetes resources.

When an Ingress resource specifies the configuration required for an Application Load Balancer, the controller reconciles that configuration and creates or updates the corresponding AWS resources.

```text
                         AWS
                          │
                          │
                          ▼
               Application Load Balancer
                          │
                          │
                          ▼
                      Kubernetes
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
          Ingress              AWS Load Balancer
          Resource                Controller
             │                         │
             │                         │
             └────────────┬────────────┘
                          │
                          ▼
                       Service
                          │
                          ▼
                         Pod
```

The controller is responsible for **reconciling Kubernetes resources with AWS load-balancing resources**. It is not part of the normal application traffic path.

The traffic flow can be viewed as:

```text
Client
  │
  ▼
AWS Application Load Balancer
  │
  ▼
Kubernetes Service
  │
  ▼
Application Pod
```

While the controller manages the AWS load balancer configuration:

```text
Kubernetes Ingress
       │
       ▼
AWS Load Balancer Controller
       │
       ▼
AWS Application Load Balancer
```

## 3. Prerequisites

Before installing the AWS Load Balancer Controller, ensure that the following components are available.

### Required Tools

* An existing Amazon EKS cluster
* AWS CLI
* `kubectl`
* `eksctl`
* Helm

Verify the Kubernetes cluster:

```bash
kubectl get nodes
```

Verify the AWS identity:

```bash
aws sts get-caller-identity
```

Verify Helm:

```bash
helm version
```

Verify `eksctl`:

```bash
eksctl version
```

### IAM Requirements

The AWS identity used for this setup must have sufficient permissions to:

* Create the IAM policy
* Create or manage the IAM service account
* Create the IAM role
* Associate the IAM role with the Kubernetes service account

The EKS cluster should also have an **IAM OIDC provider** associated with it because the setup uses **IAM Roles for Service Accounts (IRSA)**.

## 4. Step 1 — Download the IAM Policy

The AWS Load Balancer Controller requires AWS IAM permissions to create and manage AWS load-balancing resources.

The IAM policy should correspond to the controller version being installed.

For this lab, the policy file is downloaded from the AWS Load Balancer Controller repository.

```bash
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.11.0/docs/install/iam_policy.json
```

Verify that the policy file was downloaded:

```bash
ls -l iam_policy.json
```

The file should be available in the current working directory.

> **Important:** When changing the AWS Load Balancer Controller version, use the IAM policy corresponding to that controller version rather than reusing an older policy without verification.

## 5. Step 2 — Create the IAM Policy

Create an IAM policy from the downloaded policy document.

```bash
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json
```

Verify that the policy exists:

```bash
aws iam list-policies \
  --scope Local \
  --query "Policies[?PolicyName=='AWSLoadBalancerControllerIAMPolicy'].Arn"
```

The command should return the ARN of the newly created policy.

The ARN will have a format similar to:

```text
arn:aws:iam::<account-id>:policy/AWSLoadBalancerControllerIAMPolicy
```

The policy ARN will be required when creating the IAM role for the Kubernetes service account.

## 6. Step 3 — Create the Kubernetes Service Account and IAM Role

The AWS Load Balancer Controller requires an IAM role that the Kubernetes service account can assume.

This setup uses **IAM Roles for Service Accounts (IRSA)**.

The relationship is:

```text
Kubernetes Pod
      │
      ▼
Kubernetes Service Account
      │
      ▼
IAM Role
      │
      ▼
IAM Policy
      │
      ▼
AWS APIs
```

### 6.1 Create the IAM Service Account

Replace the following placeholders with the appropriate values:

```text
<your-cluster-name>
<your-aws-account-id>
```

Create the IAM service account:

```bash
eksctl create iamserviceaccount \
  --cluster=<your-cluster-name> \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name=AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::<your-aws-account-id>:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve
```

For example, if the EKS cluster is named `observability`:

```bash
eksctl create iamserviceaccount \
  --cluster=observability \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name=AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::<your-aws-account-id>:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve
```

The command creates the Kubernetes service account and the associated IAM role.

### 6.2 Verify the Service Account

Check that the service account exists:

```bash
kubectl get serviceaccount \
  aws-load-balancer-controller \
  -n kube-system
```

Expected result:

```text
aws-load-balancer-controller
```

### 6.3 Verify the IAM Role Annotation

Inspect the service account:

```bash
kubectl describe serviceaccount \
  aws-load-balancer-controller \
  -n kube-system
```

The service account should contain an annotation referencing the IAM role.

The annotation follows this general format:

```text
eks.amazonaws.com/role-arn: arn:aws:iam::<account-id>:role/AmazonEKSLoadBalancerControllerRole
```

This annotation allows the controller pods using the service account to obtain AWS permissions through the associated IAM role.

## 7. Step 4 — Add the AWS EKS Helm Repository

The AWS Load Balancer Controller is distributed through the AWS EKS Helm chart repository.

Add the repository:

```bash
helm repo add eks https://aws.github.io/eks-charts
```

Update the repository:

```bash
helm repo update
```

Verify the repository:

```bash
helm repo list
```

The `eks` repository should be listed.

## 8. Step 5 — Install the AWS Load Balancer Controller

Before installing the controller, the following information is required:

* EKS cluster name
* AWS region
* VPC ID
* Existing Kubernetes service account

For the lab cluster:

```text
Cluster: observability
Region: us-east-1
```

### 8.1 Retrieve the VPC ID

Retrieve the VPC ID associated with the EKS cluster:

```bash
aws eks describe-cluster \
  --name observability \
  --region us-east-1 \
  --query "cluster.resourcesVpcConfig.vpcId" \
  --output text
```

The command returns the VPC ID.

For example:

```text
vpc-0123456789abcdef0
```

Use the returned value in the Helm installation command.

### 8.2 Install the Controller

Replace:

```text
<your-vpc-id>
```

with the VPC ID returned by the previous command.

```bash
helm install aws-load-balancer-controller \
  eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=observability \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=us-east-1 \
  --set vpcId=<your-vpc-id>
```

### 8.3 Understand the Helm Configuration

#### `clusterName`

Specifies the name of the EKS cluster:

```text
clusterName=observability
```

#### `serviceAccount.create=false`

Prevents Helm from creating a new service account.

The service account was already created using `eksctl` and is associated with the IAM role.

#### `serviceAccount.name`

Specifies the existing service account:

```text
aws-load-balancer-controller
```

#### `region`

Specifies the AWS region in which the EKS cluster is running:

```text
region=us-east-1
```

#### `vpcId`

Specifies the VPC associated with the EKS cluster:

```text
vpcId=<your-vpc-id>
```

The controller uses this information when managing AWS load-balancing resources.

## 9. Step 6 — Verify the Installation

After installing the Helm chart, verify that the controller is running correctly.

### 9.1 Check the Deployment

```bash
kubectl get deployment \
  -n kube-system \
  aws-load-balancer-controller
```

The deployment should be available and eventually report the expected number of ready replicas.

### 9.2 Check the Pods

```bash
kubectl get pods \
  -n kube-system \
  -l app.kubernetes.io/name=aws-load-balancer-controller
```

The controller pods should eventually reach:

```text
Running
```

A successful installation should show the pods as ready.

### 9.3 Check the Helm Release

```bash
helm list -n kube-system
```

The Helm release should appear as:

```text
aws-load-balancer-controller
```

### 9.4 Check Controller Logs

Inspect the controller logs when troubleshooting or validating the installation:

```bash
kubectl logs \
  -n kube-system \
  deployment/aws-load-balancer-controller
```

The logs should not contain persistent authentication, authorization, or configuration errors.

## 10. Troubleshooting

### 10.1 Controller Pod Is Not Running

Check the controller pods:

```bash
kubectl get pods -n kube-system
```

Inspect the deployment:

```bash
kubectl describe deployment \
  aws-load-balancer-controller \
  -n kube-system
```

Inspect the controller logs:

```bash
kubectl logs \
  -n kube-system \
  deployment/aws-load-balancer-controller
```

Look for issues related to:

* IAM permissions
* Service account configuration
* OIDC provider
* Cluster configuration
* VPC configuration
* Kubernetes scheduling

### 10.2 IAM Permission Error

Inspect the service account:

```bash
kubectl describe serviceaccount \
  aws-load-balancer-controller \
  -n kube-system
```

Verify that the service account contains the expected IAM role annotation.

Verify that the IAM policy exists:

```bash
aws iam get-policy \
  --policy-arn arn:aws:iam::<your-aws-account-id>:policy/AWSLoadBalancerControllerIAMPolicy
```

Also inspect the controller logs:

```bash
kubectl logs \
  -n kube-system \
  deployment/aws-load-balancer-controller
```

IAM-related errors in the controller logs can indicate an incorrect role, policy, service account annotation, or OIDC configuration.

### 10.3 IAM OIDC Provider Is Missing

The IRSA configuration requires an IAM OIDC provider for the EKS cluster.

Check the cluster configuration:

```bash
aws eks describe-cluster \
  --name observability \
  --region us-east-1 \
  --query "cluster.identity.oidc.issuer" \
  --output text
```

If the cluster does not have the required IAM OIDC provider configured, associate one using `eksctl`:

```bash
eksctl utils associate-iam-oidc-provider \
  --region us-east-1 \
  --cluster observability \
  --approve
```

After configuring the OIDC provider, verify the IAM service account and controller installation again.

### 10.4 ALB Is Not Created

If the controller is running but an Application Load Balancer is not created, first verify the controller pods:

```bash
kubectl get pods \
  -n kube-system \
  -l app.kubernetes.io/name=aws-load-balancer-controller
```

Check the Ingress resources:

```bash
kubectl get ingress -A
```

Describe the relevant Ingress:

```bash
kubectl describe ingress <ingress-name> -n <namespace>
```

Inspect the controller logs:

```bash
kubectl logs \
  -n kube-system \
  deployment/aws-load-balancer-controller
```

Check for:

* Invalid Ingress configuration
* Incorrect annotations
* IAM permission errors
* Subnet configuration issues
* Security group issues
* Incorrect AWS region or VPC configuration
* Controller reconciliation errors

## 11. Cleanup

If the AWS Load Balancer Controller is no longer required for the lab, remove the Helm release:

```bash
helm uninstall aws-load-balancer-controller -n kube-system
```

If the IAM service account and IAM role were created specifically for this lab and are no longer required, they can also be removed after confirming that no other workload depends on them.

Before removing IAM resources, verify that they are not being used by another Kubernetes workload.

## 12. Key Takeaways

The AWS Load Balancer Controller provides the integration between Kubernetes networking resources and AWS load-balancing services.

The primary relationship is:

```text
Kubernetes Ingress
        │
        ▼
AWS Load Balancer Controller
        │
        ▼
AWS Application Load Balancer
        │
        ▼
Kubernetes Service
        │
        ▼
Application Pod
```

The installation involves:

1. Downloading the controller IAM policy.
2. Creating the IAM policy.
3. Creating an IAM role and Kubernetes service account using IRSA.
4. Adding the AWS EKS Helm repository.
5. Installing the AWS Load Balancer Controller.
6. Verifying the controller deployment and pods.
7. Troubleshooting IAM, OIDC, Ingress, and ALB-related issues when required.

For this observability lab, the controller provides the foundation for exposing monitoring interfaces such as:

```text
Prometheus
Grafana
Alertmanager
```

through an AWS Application Load Balancer and Kubernetes Ingress resources.
