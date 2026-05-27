# 🏗️ FLOW Infrastructure & DevOps Architecture

This outline covers the system configuration, container network layout, and storage layers for FLOW.

## 1. Multi-tier Virtual Private Cloud (VPC)

FLOW production infrastructure inside AWS leverages multiple isolated subnets spanning 3 Availability Zones (AZs) for high disaster readiness:

* **Public Subnet (DMZ)**: Holds AWS Application Load Balancer (ALB) and NAT Gateways.
* **Private App Subnet**: Hosts ECS Fargate container instances running the backend ledger APIs and background worker tasks. No public internet ingress is permitted.
* **Restricted DB Subnet**: Houses RDS PostgreSQL Primary + Read Replica instances and active ElastiCache Redis nodes. Inbound connections are strictly limited to security groups matching Private App containers.

---

## 2. Shared Cache and Ledger Database

* **Ledger Database**: Standard PostgreSQL 15 configuration on AWS Aurora RDS with active point-in-time recovery, configured with horizontal scaling replication.
* **Redis Store**: Managed AWS ElastiCache cluster with encryption-at-rest and in-transit enabled. Used for:
  - Cache layers (session storage)
  - Realtime user activity rate-limit buckets
  - BullMQ background queues (notification delivery, fraud analysis, analytics updates)

---

## 3. Storage Layer & Static Delivery

* **S3 Buckets**: Private buckets configured with KMS encryption-at-rest. Used to store regulatory KYC document (CNIE) scans securely.
* **CDN (CloudFront)**: Restricts static assets delivery to high-speed endpoints. Implemented with WAF rules to drop SQL-injection attempts and cross-site scripting attacks directly on the network edge.

---

## 4. Scalability Metrics Matrix

* **Vertical scaling threshold**: Instance changes when CPU usage exceeds 70% or memory usage exceeds 80%.
* **Horizontal scaling threshold**: Deploy additional ECS container tasks when average API latency rises above 250ms or BullMQ job processing delays exceed 5 seconds under heavy load.
