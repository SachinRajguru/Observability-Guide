#!/usr/bin/env bash

# ------------------------------------------------------------
# Service A traffic-generation script
# ------------------------------------------------------------
#
# Usage:
#
#   ./test.sh <LOAD_BALANCER_ADDRESS>
#
# Example:
#
#   ./test.sh abc123.elb.amazonaws.com
#
# The script intentionally calls several endpoints so that
# Prometheus receives different metric observations.
# ------------------------------------------------------------

set -u

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <LOAD_BALANCER_ADDRESS>"
  echo
  echo "Example:"
  echo "  $0 abc123.elb.amazonaws.com"
  exit 1
fi

BASE_URL="http://$1"

echo "Base URL: $BASE_URL"
echo

# Endpoints are intentionally repeated with /call-service-b
# appearing multiple times.
#
# This increases the probability that distributed tracing
# traffic will be generated during the random test.

ENDPOINTS=(
  "/"
  "/healthy"
  "/serverError"
  "/notFound"
  "/logs"
  "/example"
  "/metrics"
  "/call-service-b"
  "/call-service-b"
  "/call-service-b"
)

make_random_request() {
  local endpoint
  local http_code

  endpoint="${ENDPOINTS[$RANDOM % ${#ENDPOINTS[@]}]}"

  http_code=$(
    curl \
      --silent \
      --show-error \
      --output /dev/null \
      --write-out "%{http_code}" \
      "$BASE_URL$endpoint"
  )

  echo "GET $endpoint -> HTTP $http_code"
}

for ((i = 1; i <= 1000; i++)); do
  make_random_request

  echo "Request $i completed"

  # Small delay so that the traffic is visible without
  # immediately overwhelming the application.
  sleep 0.1
done

echo
echo "Completed 1000 requests."

# Make executable:
# 
# chmod +x test.sh