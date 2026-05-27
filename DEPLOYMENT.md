# 🚀 FLOW Deployment Manual (Step 12)

This document describes the deployment procedures for the FLOW fintech super app.

## 1. Environment Architecture

We maintain three distinct deployment environments:

| Environment | Host URL | DB Strategy | Purpose | Secrets Management |
| :--- | :--- | :--- | :--- | :--- |
| **Development** | `localhost:3000` | Local Docker PG | Developer local sandbox | Local `.env` files |
| **Staging** | `https://api.staging.flow.com` | AWS RDS Single-AZ | Pre-prod verification, QA | AWS Secrets Manager |
| **Production** | `https://api.flow.com` | AWS RDS Multi-AZ + Replica | Real users & real funds | Dedicated Vault Cluster |

---

## 2. Fast-Track Cloud Deployments (Railway MVP)

For quick previews and testing, FLOW can run on Railway:

1. **Prerequisites**: Connect your GitHub repository to Railway.
2. **Database Provisioning**: Provision PostgreSQL and Redis services on the Railway dashboard.
3. **Environment Injection**: Add all env variables listed in `.env.example` in Railway's Shared Variables panel.
4. **Build & Exec**: Railway automatically detects the root `Dockerfile`, executes a multi-stage compilation, and binds to port `3000`.

---

## 3. High Availability Enterprise Deployments (AWS/Kubernetes)

For production-grade scalability, FLOW is containerized and deployed to **AWS ECS (Fargate)** or an **EKS (Elastic Kubernetes Service)** cluster.

### AWS ECS Architecture Flow:

```txt
Web Clients 
   ↳ CloudFront CDN (Static assets caching) 
       ↳ Route53 (DNS lookup)
           ↳ Application Load Balancer (ALB) — Performs SSL/TLS Termination
               ↳ Private subnet VPC Tasks 
                   ↳ Backend ECS Fargate Service (Port 3000)
                       ↳ RDS DB Subnet (PostgreSQL Cluster)
                       ↳ ElastiCache Subnet (Redis Cluster)
```

---

## 4. Manual Verification Checks Before Ship

Prior to triggering production merge pipelines, engineers must verify:
- [ ] No hardcoded security API keys exist in the repository tree.
- [ ] All database schemas migrations compiled successfully.
- [ ] Local container test run is successful:
  ```bash
  docker-compose -f docker-compose.yml up --build -d
  ```
- [ ] Output of `npm run lint` is cleanly passing.
