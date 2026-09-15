
## PromQL — Querying Prometheus Metrics

> **File:** `README.md`

## Table of Contents

1. [Learning Objectives](#1-learning-objectives)
2. [Metrics in Prometheus](#2-metrics-in-prometheus)
3. [Prometheus Metrics and Time Series](#3-prometheus-metrics-and-time-series)
4. [Labels](#4-labels)
5. [What Is PromQL?](#5-what-is-promql)
6. [PromQL Data Types](#6-promql-data-types)
7. [Metric Selectors](#7-metric-selectors)
   * [7.1 Instant Vector Selectors](#71-instant-vector-selectors)
   * [7.2 Exact Label Matching](#72-exact-label-matching)
   * [7.3 Multiple Label Matchers](#73-multiple-label-matchers)
   * [7.4 Regular Expression Matching](#74-regular-expression-matching)
   * [7.5 Negative Matching](#75-negative-matching)
8. [Range Vector Selectors](#8-range-vector-selectors)
9. [Aggregation in PromQL](#9-aggregation-in-promql)
   * [9.1 `sum()`](#91-sum)
   * [9.2 `avg()`](#92-avg)
   * [9.3 Grouping with `by`](#93-grouping-with-by)
   * [9.4 Grouping with `without`](#94-grouping-with-without)
10. [Common PromQL Functions](#10-common-promql-functions)
    * [10.1 `rate()`](#101-rate)
    * [10.2 `increase()`](#102-increase)
    * [10.3 `avg_over_time()`](#103-avg_over_time)
    * [10.4 `histogram_quantile()`](#104-histogram_quantile)
11. [Practical PromQL Examples for Kubernetes](#11-practical-promql-examples-for-kubernetes)
12. [Working with Counters](#12-working-with-counters)
13. [Working with Histograms](#13-working-with-histograms)
14. [Practical PromQL Workflow](#14-practical-promql-workflow)
15. [PromQL in the Prometheus UI](#15-promql-in-the-prometheus-ui)
16. [Troubleshooting PromQL Queries](#16-troubleshooting-promql-queries)
17. [PromQL Best Practices](#17-promql-best-practices)
18. [Key Takeaways](#18-key-takeaways)

## 1. Learning Objectives

By the end of this section, we should be able to:

* Understand what a metric represents in Prometheus.
* Understand how Prometheus identifies and stores time series.
* Understand the purpose of labels and label dimensions.
* Write basic PromQL queries.
* Use metric and label selectors.
* Understand instant vectors and range vectors.
* Use exact, negative, and regular-expression label matching.
* Aggregate time series using operators such as `sum()` and `avg()`.
* Understand the difference between `rate()` and `increase()`.
* Work with counter metrics.
* Understand the basic use of histogram buckets and `histogram_quantile()`.
* Query Kubernetes metrics using PromQL.
* Build progressively more useful PromQL expressions.
* Troubleshoot common PromQL query problems.
* Apply PromQL best practices when working with large Kubernetes environments.

## 2. Metrics in Prometheus

Metrics are numerical measurements that describe the state or behavior of a system over time.

Common examples include:

* CPU usage
* Memory consumption
* Network traffic
* HTTP request rate
* Error counts
* Container restarts
* API latency
* Disk usage
* Application performance

Examples of measurements include:

```text
CPU Usage        = 72%
Memory Usage     = 4.2 GiB
HTTP Requests    = 15,240
Container Restarts = 3
API Latency      = 240 ms
```

Prometheus collects these measurements and stores them as **time series**.

### Simple Mental Model

```text
Application / Kubernetes / Node
              |
              | Metrics
              v
         Prometheus
              |
              | Time Series
              v
            PromQL
              |
              | Query / Analysis
              v
           Grafana
```

Metrics help answer questions such as:

* Is CPU usage increasing?
* How many containers restarted?
* Which namespace is consuming the most memory?
* What is the current request rate?
* What is the 95th percentile API latency?
* Which targets are currently unavailable?

## 3. Prometheus Metrics and Time Series

A Prometheus time series is identified by:

```text
Metric name + complete set of labels
```

For example:

```promql
container_cpu_usage_seconds_total{
  namespace="kube-system",
  pod="kube-proxy-abc",
  container="kube-proxy"
}
```

The metric name is:

```text
container_cpu_usage_seconds_total
```

The labels are:

```text
namespace="kube-system"
pod="kube-proxy-abc"
container="kube-proxy"
```

The combination of the metric name and the complete label set identifies one time series.

### Example

The following are different time series:

```promql
http_requests_total{method="GET",status="200"}
http_requests_total{method="GET",status="500"}
http_requests_total{method="POST",status="200"}
```

All three use the same metric name:

```text
http_requests_total
```

However, their label values are different, so Prometheus treats them as different time series.

### Time-Series Mental Model

```text
Metric Name
     |
     +-- Label Set A
     |      |
     |      +-- Samples over time
     |
     +-- Label Set B
     |      |
     |      +-- Samples over time
     |
     +-- Label Set C
            |
            +-- Samples over time
```

Each time series contains samples associated with timestamps.

## 4. Labels

Labels are key-value pairs attached to metrics.

They provide dimensions that allow us to distinguish and filter time series.

For example:

```promql
http_requests_total{
  namespace="production",
  pod="orders-api-7d8c9",
  method="GET",
  status="200"
}
```

The labels are:

```text
namespace="production"
pod="orders-api-7d8c9"
method="GET"
status="200"
```

### Why Are Labels Important?

Without labels, a metric may provide only a single series.

Labels allow us to ask more specific questions.

For example:

```promql
http_requests_total
```

returns matching request series.

We can filter them by namespace:

```promql
http_requests_total{
  namespace="production"
}
```

Or by HTTP status:

```promql
http_requests_total{
  status="500"
}
```

Or by both:

```promql
http_requests_total{
  namespace="production",
  status="500"
}
```

### Common Label Dimensions

Depending on the metric source, labels may represent:

* Namespace
* Pod
* Container
* Node
* Service
* Instance
* Job
* Application
* HTTP method
* HTTP status
* Endpoint

### Label-Based Mental Model

A metric can be thought of as a collection of dimensions:

```text
Metric                  Namespace     Pod          Status
----------------------------------------------------------------
http_requests_total     production    orders-api   200
http_requests_total     production    orders-api   500
http_requests_total     staging       orders-api   200
```

The labels allow PromQL to select, filter, and aggregate these different time series.

> **Important:** Labels are powerful, but excessive label cardinality can create a very large number of time series. Labels should represent useful dimensions rather than highly unique values such as request IDs or randomly generated identifiers.

## 5. What Is PromQL?

**PromQL (Prometheus Query Language)** is the query language used to retrieve and analyze time-series data stored in Prometheus.

PromQL allows us to:

* Select time series.
* Filter using labels.
* Perform mathematical operations.
* Aggregate time series.
* Calculate rates.
* Calculate counter increases.
* Analyze histogram data.
* Compare metrics.
* Build dashboard queries.
* Build alert expressions.

A simple query is:

```promql
up
```

The `up` metric is commonly used to determine whether a Prometheus target was successfully scraped.

Conceptually:

```text
1 → Target scrape succeeded
0 → Target scrape failed
```

A simplified PromQL workflow is:

```text
Prometheus Time Series
          |
          v
        PromQL
          |
    +-----+-----+
    |     |     |
    v     v     v
 Select Calculate Aggregate
    |     |     |
    +-----+-----+
          |
          v
       Result
          |
    +-----+-----+
    |     |     |
    v     v     v
Prometheus Grafana Alerting
   UI
```

## 6. PromQL Data Types

PromQL expressions work with several fundamental data types.

| Type           | Description                                                                              |
| -------------- | ---------------------------------------------------------------------------------------- |
| Instant vector | A set of time series containing one sample for each series at a specific evaluation time |
| Range vector   | A set of time series containing samples over a specified time range                      |
| Scalar         | A simple numeric value                                                                   |
| String         | A string value                                                                           |

The two types most frequently encountered when working with Kubernetes metrics are **instant vectors** and **range vectors**.

## 7. Metric Selectors

Metric selectors allow us to select specific time series.

### 7.1 Instant Vector Selectors

A simple metric selector is:

```promql
container_cpu_usage_seconds_total
```

This selects all matching time series for the metric.

The result is an **instant vector**.

Conceptually:

```text
container_cpu_usage_seconds_total
              |
              v
       Matching Series
              |
       +------+------+------+
       |      |      |
       v      v      v
     Pod A  Pod B  Pod C
```

The returned value represents the latest sample available for each matching series at the query evaluation time.

### 7.2 Exact Label Matching

We can filter a metric using an exact label match:

```promql
container_cpu_usage_seconds_total{
  namespace="kube-system"
}
```

This selects only time series where:

```text
namespace = kube-system
```

### 7.3 Multiple Label Matchers

Multiple label matchers can be specified:

```promql
container_cpu_usage_seconds_total{
  namespace="kube-system",
  pod="kube-proxy-abc"
}
```

Both conditions must match.

Conceptually:

```text
Metric
  |
  +-- namespace = kube-system
  |
  +-- pod = kube-proxy-abc
           |
           v
     Matching Series
```

### 7.4 Regular Expression Matching

PromQL supports regular-expression matching using:

```text
=~
```

For example:

```promql
container_cpu_usage_seconds_total{
  namespace="kube-system",
  pod=~"kube-proxy.*"
}
```

This matches pod names such as:

```text
kube-proxy-abc123
kube-proxy-def456
kube-proxy-xyz789
```

Regular expressions are particularly useful in Kubernetes because resource names often contain generated suffixes.

### 7.5 Negative Matching

PromQL supports two common forms of negative matching.

#### Not Equal

Use:

```text
!=
```

Example:

```promql
http_requests_total{
  status!="200"
}
```

This excludes series whose `status` label is `200`.

#### Negative Regular Expression

Use:

```text
!~
```

Example:

```promql
http_requests_total{
  pod!~"test-.*"
}
```

This excludes series whose `pod` label matches the specified regular expression.

## 8. Range Vector Selectors

An instant vector represents the latest sample for each matching time series at the evaluation time.

A **range vector** contains samples collected over a specified period.

For example:

```promql
container_cpu_usage_seconds_total[5m]
```

The:

```text
[5m]
```

means:

```text
Previous five minutes
```

Conceptually:

```text
Current Time
     |
     v
|-------------------|
      5 minutes
|-------------------|
     |
     v
Range Vector
```

A range selector is commonly used with functions such as:

```promql
rate()
```

and:

```promql
increase()
```

For example:

```promql
rate(
  container_cpu_usage_seconds_total[5m]
)
```

The metric provides the samples, while the range selector tells PromQL which historical samples should be considered.

## 9. Aggregation in PromQL

Kubernetes environments can produce many time series.

Aggregation allows us to combine those series into a smaller and more useful result.

Common aggregation operators include:

```text
sum
avg
min
max
count
stddev
stdvar
count_values
topk
bottomk
```

### 9.1 `sum()`

The `sum()` operator adds values across matching time series.

For example:

```promql
sum(
  rate(container_cpu_usage_seconds_total[5m])
)
```

This combines the matching CPU rates into a single result.

### 9.2 `avg()`

The `avg()` operator calculates the average across matching series.

Example:

```promql
avg(
  container_memory_usage_bytes
)
```

This calculates the average value across the selected time series.

### 9.3 Grouping with `by`

Aggregation can retain selected labels using `by`.

For example:

```promql
sum(
  rate(http_requests_total[5m])
) by (service)
```

This calculates request rate separately for each service.

Conceptually:

```text
HTTP Requests
      |
      +-- frontend
      +-- orders
      +-- payments
      +-- inventory
              |
              v
          Group by
           service
              |
              v
       Service-level results
```

Another example is memory usage by namespace:

```promql
sum(
  container_memory_usage_bytes
) by (namespace)
```

This produces a separate result for each namespace.

### 9.4 Grouping with `without`

PromQL also supports the `without` clause.

For example:

```promql
sum(
  rate(http_requests_total[5m])
) without (instance)
```

This aggregates series while excluding the specified label from the grouping dimensions.

`by` is useful when we want to explicitly retain particular labels.

`without` is useful when we want to aggregate while ignoring particular labels.

## 10. Common PromQL Functions

PromQL provides many functions for analyzing time-series data.

Some commonly used functions include:

```text
rate()
increase()
avg_over_time()
max_over_time()
min_over_time()
sum_over_time()
histogram_quantile()
```

The following functions are especially useful for Kubernetes monitoring.

### 10.1 `rate()`

The `rate()` function calculates the average per-second increase of a counter over a specified range.

Example:

```promql
rate(
  container_cpu_usage_seconds_total[5m]
)
```

Because:

```text
container_cpu_usage_seconds_total
```

is a counter, `rate()` helps us understand how quickly the accumulated value is increasing.

#### Counter Mental Model

```text
Counter

100
 |
120
 |
150
 |
190
 |
230
 |
 +------ rate() ------+
                       |
                       v
                Increase per second
```

A useful rule of thumb is:

> Use `rate()` when we want the ongoing per-second behavior of a counter.

For example:

```promql
rate(http_requests_total[5m])
```

answers approximately:

> How many requests per second are occurring?

### 10.2 `increase()`

The `increase()` function calculates the total increase of a counter over a specified time range.

Example:

```promql
increase(
  kube_pod_container_status_restarts_total[1h]
)
```

This estimates how much the restart counter increased during the previous hour.

For example, if a counter changes from:

```text
10 → 14
```

the increase is approximately:

```text
4
```

#### Difference Between `rate()` and `increase()`

| Function     | Main Question                                         |
| ------------ | ----------------------------------------------------- |
| `rate()`     | How quickly is the counter increasing per second?     |
| `increase()` | How much did the counter increase during this period? |

Example:

```promql
rate(http_requests_total[5m])
```

asks:

> What is the approximate request rate per second?

Whereas:

```promql
increase(http_requests_total[1h])
```

asks:

> Approximately how many requests were added during the last hour?

### 10.3 `avg_over_time()`

`avg_over_time()` calculates the average value of each series over a specified range.

For example:

```promql
avg_over_time(
  container_memory_usage_bytes[15m]
)
```

This calculates the average memory usage for each matching time series over the previous 15 minutes.

This differs from:

```promql
avg(container_memory_usage_bytes)
```

because `avg()` aggregates **across different time series**, while `avg_over_time()` calculates an average **across samples within the selected time range for each series**.

This distinction is important.

### 10.4 `histogram_quantile()`

`histogram_quantile()` calculates a quantile from Prometheus histogram bucket data.

A common use case is calculating the 95th percentile:

```promql
histogram_quantile(
  0.95,
  sum(
    rate(apiserver_request_duration_seconds_bucket[5m])
  ) by (le)
)
```

Here:

```text
0.95
```

represents the 95th percentile.

The `le` label represents the histogram bucket's upper boundary.

For example:

```text
le="0.1"
le="0.5"
le="1"
le="5"
```

The aggregation preserves `le` so that `histogram_quantile()` can use the bucket boundaries to estimate the requested percentile.

## 11. Practical PromQL Examples for Kubernetes

The following queries are useful when exploring a Kubernetes monitoring environment.

### 11.1 Check Target Availability

```promql
up
```

Interpretation:

```text
1 → Target was successfully scraped
0 → Target scrape failed
```

### 11.2 View Container CPU Metrics

```promql
container_cpu_usage_seconds_total
```

This returns the matching container CPU time series.

Remember that this is a cumulative counter and should generally not be interpreted directly as a CPU percentage.

### 11.3 Calculate Container CPU Rate

```promql
rate(
  container_cpu_usage_seconds_total[5m]
)
```

This calculates the per-second rate of accumulated container CPU time.

### 11.4 CPU Rate by Namespace

```promql
sum(
  rate(container_cpu_usage_seconds_total[5m])
) by (namespace)
```

This aggregates container CPU rate by namespace.

The exact interpretation depends on which container series are present and how the metric is exposed in the environment.

### 11.5 Filter by Namespace

```promql
container_cpu_usage_seconds_total{
  namespace="kube-system"
}
```

This selects container CPU time series belonging to the `kube-system` namespace.

### 11.6 Filter Pods Using a Regular Expression

```promql
container_cpu_usage_seconds_total{
  namespace="kube-system",
  pod=~"kube-proxy.*"
}
```

This selects matching `kube-proxy` pod series.

### 11.7 Memory Usage by Namespace

```promql
sum(
  container_memory_usage_bytes
) by (namespace)
```

This aggregates matching container memory series by namespace.

### 11.8 Average Memory Usage by Namespace

```promql
avg(
  container_memory_usage_bytes
) by (namespace)
```

This calculates the average across the matching series in each namespace.

The choice between `sum()` and `avg()` depends on the question being asked.

For example:

```text
sum() → How much memory is represented across the series?

avg() → What is the average value across the series?
```

### 11.9 Container Restarts During the Last Hour

```promql
increase(
  kube_pod_container_status_restarts_total[1h]
)
```

This estimates the increase in container restart counters during the previous hour.

### 11.10 Container Restarts by Pod

```promql
sum(
  increase(kube_pod_container_status_restarts_total[1h])
) by (pod)
```

This aggregates restart increases by pod.

If the environment contains multiple namespaces with the same pod names, grouping by both namespace and pod may be more useful:

```promql
sum(
  increase(kube_pod_container_status_restarts_total[1h])
) by (namespace, pod)
```

### 11.11 HTTP Request Rate

For an application exposing an HTTP request counter:

```promql
rate(
  http_requests_total[5m]
)
```

Request rate grouped by service:

```promql
sum(
  rate(http_requests_total[5m])
) by (service)
```

### 11.12 HTTP 5xx Error Rate

If the application exposes an HTTP status label:

```promql
sum(
  rate(http_requests_total{status=~"5.."}[5m])
)
```

The regular expression:

```text
5..
```

matches HTTP status codes in the `500–599` range.

For service-level error rates:

```promql
sum(
  rate(http_requests_total{status=~"5.."}[5m])
) by (service)
```

### 11.13 API Server P95 Latency

For a Prometheus histogram such as:

```text
apiserver_request_duration_seconds_bucket
```

a 95th percentile query can be written as:

```promql
histogram_quantile(
  0.95,
  sum(
    rate(apiserver_request_duration_seconds_bucket[5m])
  ) by (le)
)
```

This estimates the 95th percentile of API server request duration for the selected data.

## 12. Working with Counters

A **counter** is a metric type that normally increases over time and may reset when the monitored process restarts.

Common examples include:

```text
http_requests_total
container_cpu_usage_seconds_total
kube_pod_container_status_restarts_total
```

The raw counter tells us how much has accumulated.

It does not directly tell us the current rate.

### Raw Counter

```promql
http_requests_total
```

This returns the current counter value for each matching series.

### Request Rate

```promql
rate(
  http_requests_total[5m]
)
```

This calculates the average per-second increase over the previous five minutes.

### Increase During a Period

```promql
increase(
  http_requests_total[1h]
)
```

This estimates how much the counter increased during the previous hour.

### Counter Mental Model

```text
Counter
   |
   v
100 → 120 → 150 → 190 → 230
   |
   +----------------------+
                          |
                    rate() / increase()
                          |
                          v
                  Useful measurement
```

### Important Rule

Use counter functions for counter metrics:

```promql
rate(counter_metric[5m])
```

or:

```promql
increase(counter_metric[1h])
```

The selected time range should also be long enough to contain meaningful samples.

## 13. Working with Histograms

Histograms are useful when we need to understand the distribution of observations.

Common use cases include:

* Request latency
* Response duration
* Request size
* Processing time

A Prometheus histogram commonly exposes bucket series ending with:

```text
_bucket
```

For example:

```text
http_request_duration_seconds_bucket
```

A histogram may contain bucket boundaries such as:

```text
le="0.1"
le="0.25"
le="0.5"
le="1"
le="2.5"
le="5"
```

The `le` label represents the upper boundary of each bucket.

### Why Histograms Are Useful

Suppose the average API latency is:

```text
200 ms
```

That does not tell us whether:

* almost every request takes approximately 200 ms, or
* most requests are fast while a small percentage are extremely slow.

A percentile can provide additional insight.

For example:

```text
P95 = 500 ms
```

means that approximately 95% of the observed requests are estimated to be at or below 500 ms, while approximately 5% are above that value.

### P95 Example

```promql
histogram_quantile(
  0.95,
  sum(
    rate(apiserver_request_duration_seconds_bucket[5m])
  ) by (le)
)
```

The basic flow is:

```text
Histogram Buckets
       |
       v
rate()
       |
       v
Aggregate by le
       |
       v
histogram_quantile()
       |
       v
Estimated Percentile
```

## 14. Practical PromQL Workflow

When investigating a monitoring problem, avoid starting with a complicated query.

Use a progressive approach.

### Step 1 — Confirm That Prometheus Is Scraping Targets

Start with:

```promql
up
```

If expected targets are missing or unhealthy, investigate target discovery and scraping before troubleshooting the PromQL expression.

### Step 2 — Confirm That the Metric Exists

Try the metric directly:

```promql
container_cpu_usage_seconds_total
```

If there is no result, verify the metric name and its source.

### Step 3 — Inspect the Available Labels

Look at the returned series and identify useful labels such as:

```text
namespace
pod
container
node
instance
job
service
```

Do not assume that every metric contains every label.

### Step 4 — Add a Label Filter

For example:

```promql
container_cpu_usage_seconds_total{
  namespace="monitoring"
}
```

### Step 5 — Add a Range Selector

For counter analysis:

```promql
container_cpu_usage_seconds_total[5m]
```

### Step 6 — Apply a Function

For example:

```promql
rate(
  container_cpu_usage_seconds_total[5m]
)
```

### Step 7 — Aggregate the Result

For example:

```promql
sum(
  rate(container_cpu_usage_seconds_total[5m])
) by (namespace)
```

The progression is:

```text
Metric
  |
  v
Label Filter
  |
  v
Range Selector
  |
  v
Function
  |
  v
Aggregation
  |
  v
Useful Result
```

This approach makes PromQL easier to understand, debug, and maintain.

## 15. PromQL in the Prometheus UI

After Prometheus is installed and accessible, the Prometheus web UI can be used to experiment with PromQL.

### Accessing Prometheus

First identify the Prometheus Service:

```bash
kubectl get svc -n monitoring
```

The Service name depends on the Helm release and chart configuration, so avoid assuming a fixed name.

Port-forward the appropriate Service:

```bash
kubectl port-forward \
  -n monitoring \
  svc/<prometheus-service> \
  9090:9090
```

Open:

```text
http://localhost:9090
```

### Run a Basic Query

Start with:

```promql
up
```

Then try:

```promql
container_cpu_usage_seconds_total
```

Next, add a label filter:

```promql
container_cpu_usage_seconds_total{
  namespace="kube-system"
}
```

Then apply a range function:

```promql
rate(
  container_cpu_usage_seconds_total[5m]
)
```

The progression is:

```text
Metric
  |
  v
Label Filter
  |
  v
Range Selector
  |
  v
Function
  |
  v
Calculated Result
```

### Table and Graph Views

Prometheus can display query results in different views.

The table view is useful for inspecting:

* Metric values
* Labels
* Individual time series

The graph view is useful for understanding:

* Trends
* Changes over time
* Spikes
* Drops
* Repeated behavior

When troubleshooting, switching between table and graph views can help determine whether a problem is related to the query or the underlying metric behavior.

## 16. Troubleshooting PromQL Queries

### 16.1 Query Returns No Data

Start with:

```promql
up
```

If no expected targets are present, check Prometheus target discovery and scraping.

Then verify that the requested metric exists:

```promql
container_cpu_usage_seconds_total
```

### 16.2 Metric Does Not Exist

Metric names can vary depending on:

* Prometheus configuration
* Kubernetes version
* Exporter version
* kube-prometheus-stack version
* Metric source
* Enabled collectors
* Application instrumentation

Do not assume that every metric is available in every environment.

Search for available metrics in the Prometheus UI and inspect the relevant scrape targets.

### 16.3 Label Filter Returns No Data

For example:

```promql
container_cpu_usage_seconds_total{
  namespace="production"
}
```

If this returns no results, first query the metric without the filter:

```promql
container_cpu_usage_seconds_total
```

Then inspect the actual label names and values.

A filter only works when the selected series contain the specified label and matching value.

### 16.4 Regex Does Not Match

Use:

```text
=~
```

for positive regular-expression matching:

```promql
pod=~"kube-proxy.*"
```

Use:

```text
!~
```

to exclude matching values:

```promql
pod!~"test-.*"
```

Also verify that the label itself exists on the selected series.

### 16.5 `rate()` Returns Unexpected Results

Check that:

1. The metric is a counter.
2. A range selector is provided.
3. The selected range contains enough samples.
4. The target is being scraped regularly.
5. The counter is not resetting frequently.
6. The query is selecting the intended series.

For example:

```promql
rate(http_requests_total[5m])
```

is appropriate for a request counter.

### 16.6 Query Is Too Expensive

Large Kubernetes environments can contain very large numbers of time series.

Be careful with:

* High-cardinality labels
* Very broad regular expressions
* Very large time ranges
* Queries returning thousands of series
* Unnecessary aggregation
* Complex expressions over high-cardinality metrics

Start with a narrow query and expand it gradually.

For example, instead of immediately querying every series:

```promql
container_cpu_usage_seconds_total
```

start with a specific namespace:

```promql
container_cpu_usage_seconds_total{
  namespace="monitoring"
}
```

Then expand the query only when required.

## 17. PromQL Best Practices

### 17.1 Understand the Metric Type First

Before using a function, determine what the metric represents.

For example:

```text
Counter → rate(), increase()
Gauge   → current value, avg_over_time(), max_over_time()
Histogram → histogram_quantile() with bucket data
```

Do not apply counter functions blindly to gauges.

### 17.2 Inspect Labels Before Filtering

Do not assume labels such as:

```text
namespace
pod
container
service
instance
```

are available on every metric.

Inspect the actual series first.

### 17.3 Use Specific Queries

Avoid unnecessarily broad queries in large environments.

Prefer:

```promql
container_cpu_usage_seconds_total{
  namespace="monitoring"
}
```

over unnecessarily querying every available series when the investigation is limited to one namespace.

### 17.4 Be Careful with Regular Expressions

Regular expressions are useful, but broad expressions can return many time series.

For example:

```promql
pod=~".*"
```

provides little filtering value and may select a large number of series.

Use specific patterns where possible.

### 17.5 Control Label Cardinality

Avoid adding highly unique values as metric labels.

Examples of potentially dangerous labels include:

```text
request_id
user_id
session_id
transaction_id
```

Large numbers of unique label values can create excessive time-series cardinality and increase Prometheus resource consumption.

### 17.6 Use `rate()` for Counter Trends

When the goal is to understand the ongoing behavior of a counter, use:

```promql
rate(metric[5m])
```

rather than interpreting the raw counter value as a rate.

### 17.7 Use `increase()` for Period Totals

When the question is:

> How much did this counter increase during a period?

use:

```promql
increase(metric[1h])
```

### 17.8 Build Queries Progressively

Start simple:

```promql
metric_name
```

Then add:

```text
Label filter
    ↓
Range selector
    ↓
Function
    ↓
Aggregation
```

This makes both troubleshooting and query development easier.

## 18. Key Takeaways

### Metrics

Metrics are numerical measurements collected from monitored systems over time.

### Time Series

A Prometheus time series is identified by:

```text
Metric name + complete label set
```

### Labels

Labels provide dimensions that allow us to:

* Filter metrics.
* Group metrics.
* Compare different resources.
* Build more specific queries.

### PromQL

PromQL is the language used to:

* Select time series.
* Filter labels.
* Calculate values.
* Aggregate series.
* Analyze trends.
* Build dashboard queries.
* Create alert expressions.

### Selectors

A metric selector:

```promql
metric_name
```

selects matching time series.

An exact label filter:

```promql
metric_name{
  label="value"
}
```

filters using an exact label match.

A regular-expression filter:

```promql
metric_name{
  label=~"pattern.*"
}
```

matches label values using a regular expression.

### Range Vectors

A range selector:

```promql
metric_name[5m]
```

selects samples from the previous five minutes.

### Aggregation

Common aggregation operators include:

```promql
sum(...)
avg(...)
min(...)
max(...)
count(...)
```

Grouping can be controlled using:

```promql
by (...)
```

or:

```promql
without (...)
```

### Counters

Counters normally increase over time.

Use:

```promql
rate(counter_metric[5m])
```

to calculate an average per-second rate.

Use:

```promql
increase(counter_metric[1h])
```

to estimate the total increase over a time period.

### Histograms

Histograms are useful for understanding distributions such as latency.

A common percentile query uses:

```promql
histogram_quantile(...)
```

with histogram bucket data.

### Final Mental Model

```text
                   Prometheus
                       |
                       v
                    Metrics
                       |
                       v
                     Labels
                       |
                       v
                  Time Series
                       |
                       v
                    PromQL
                       |
          +------------+------------+
          |            |            |
          v            v            v
        Select     Calculate    Aggregate
          |            |            |
          +------------+------------+
                       |
                       v
                 Useful Insight
                       |
              +--------+--------+
              |        |        |
              v        v        v
         Prometheus  Grafana  Alerting
             UI
```

The key progression is:

```text
Metric
   ↓
Labels
   ↓
Time Series
   ↓
PromQL
   ↓
Selectors / Functions / Aggregation
   ↓
Useful Monitoring Insight
```

PromQL turns raw Prometheus time-series data into useful information for monitoring, troubleshooting, dashboards, and alerting.
