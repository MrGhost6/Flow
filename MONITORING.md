# 📊 FLOW Observability & Telemetry Standard

Observability on FLOW tracks system behavior, API request lifecycles, and security health across three core channels.

## 1. APM Prometheus Metrics Scrapers

Metrics are exposed on the server node at `GET /api/metrics/performance`. Prometheus scrapes these metrics periodically to monitor:

* `flow_http_requests_total`: Counts HTTP request endpoints hit with corresponding status status (e.g. 200, 401, 500).
* `flow_api_latency_seconds`: Measures API response delays over percentile distributions (p50, p90, p99).
* `flow_auth_failures_total`: Monitors systemic credential attacks or rate-limit lockouts.
* `flow_failed_transactions_total`: Isolates database timeouts or third-party bank ledger failures.
* `flow_queue_jobs_pending`: Monitors backpressure across active BullMQ worker flows.

---

## 2. Grafana Central Operations Dashboards

Visual layouts are organized in Grafana into distinct dashboards:

* **SRE Overview**: Visualizes active system CPU usage, container memory consumption, and network interface byte rates.
* **Fintech Ledger Desk**: Visualizes transaction volume graphs (USD/EUR/MAD), daily clearing settlement status, and ongoing fraud scoring distributions.
* **System Health Desk**: Monitors active server load, DB connection pool levels, and Redis write-latency anomalies.

---

## 3. Realtime Critical Alert Rules

We enforce automatic PagerDuty metrics thresholds for emergency intervention:

| Metric Indicator | Warning Trigger | Critical Trigger (SRE Page) |
| :--- | :--- | :--- |
| **API Latency** | > 350ms average over 5m | > 1000ms average over 1m |
| **System Error Rate** | > 1.5% of total request traffic | > 5% of total request traffic |
| **DB Pool Levels** | > 85% of connection max limits | > 98% of connection max limits |
| **Fraud Risk Signals** | 2 alerts flagged in 10 minutes | > 5 alerts flagged in 5 minutes |
| **BullMQ Queue Wait** | > 100 jobs standing for 10m | > 500 jobs standing for 2m |

---

## 4. Frontend & Server Exceptions (Sentry)

Whenever an API route handler catches an unhandled rejection, or the React runtime encounters a visual rendering crash, it issues full source-mapped traces to Sentry showing user session trails, environment flags, and browser specifications safely.
