# ↩️ FLOW CI/CD Deployment Rollback Playbook

What to do when a production deployment contains fatal faults or triggers critical metrics alarms.

## 1. Automated Pipeline Rollbacks

When AWS ECS deployments fail to pass Fargate healthchecks, the AWS ALB automatically denies traffic propagation to bad nodes. The pipeline implements:

1. **Blue/Green Deployment**: The old container collection (stable state Blue) remains alive while the new version (unstable state Green) is evaluated.
2. **Auto-Rollback**: If the ECS cluster detects health checks failing for more than 2 minutes, Fargate kills the new container instances and routes 100% of network traffic back to stable Blue, requiring no SRE intervention.

---

## 2. Emergency Manual Redirection

If a bug gets through pre-prod verification and begins generating customer-facing payment errors or credential leaks in production, initiate an emergency manual version revert:

```bash
# Set credentials safely
export AWS_ACCESS_KEY_ID="KMS_ENCRYPTED_KEY_ID"
export AWS_SECRET_ACCESS_KEY="KMS_ENCRYPTED_SECRET"

# Rollback deployment immediately to the previous ECR stable container image hash
aws ecs update-service \
  --cluster flow-production-cluster \
  --service flow-prod-web-service \
  --task-definition flow-api-task:stable-fallback \
  --force-new-deployment
```

---

## 3. Database Migration Post-Mortems

If the deployment updated the database schema (e.g., adding column fields to the wallets table) and is rejected, you must handle databases rollback safely:

* **Strict Requirement**: Database schema migrations must ALWAYS be backward compatible. NEVER drop or rename database tables or columns during a deploy cycle.
* **If schema changes must be undone**: Run the down migration script from the local ECS administrative console task:
  ```bash
  npm run db:migrate:down
  ```
* Ensure you take a manual cold snapshot of the RDS clustered instance prior to running any manual schema downgrades!
