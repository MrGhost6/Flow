# 💾 FLOW Database Backup & Disaster Recovery (DR) Plan

Fintech infrastructure operations require zero-loss database resilience guidelines.

## 1. Relational Ledger Backups (AWS RDS)

FLOW production PostgreSQL databases run under continuous point-in-time recovery (PITR) configurations:

* **Automated Daily Backups**: AWS RDS takes automated snapshots of the primary SQL database every 24 hours during off-peak times (02:00 UTC).
* **Backup Retention**: Daily automated snapshots are retained for 30 days in locked S3 buckets with Object Lock enabled to prevent accidental deletion.
* **Continuous WAL Archiving**: SQL Write-Ahead Logs (WAL) are streamed to secure S3 storage layers every 5 minutes, allowing systems to be restored to any exact second in the past month.

---

## 2. Disaster Recovery Targets (RPO & RTO)

Our Recovery Point Objective (RPO) and Recovery Time Objective (RTO) targets define our acceptable recovery thresholds:

* **Recovery Point Objective (RPO)**: **< 10 minutes** (maximum allowable data loss in the worst-case regional blackout).
* **Recovery Time Objective (RTO)**: **< 15 minutes** (maximum time allowed to restore system-wide operations during serious system failure).

---

## 3. Disaster Recovery Restoration Procedure

In the event of database corruption or a regional outage, perform these recovery steps:

1. **Isolate the system**: Enable the Global Emergency Lockdown directly from the FLOW Control Console to halt all live transaction routing.
2. **Identify target restore point**: Determine the exact timestamp block immediately preceding the database failure or corruption event.
3. **Provision Restored Cluster**: Restore the AWS Aurora cluster from the nearest point-in-time automated snapshot or transaction log:
   ```bash
   aws rds restore-db-cluster-to-point-in-time \
     --source-db-cluster-identifier prod-flow-db-primary \
     --target-db-cluster-identifier prod-flow-db-restored \
     --restore-to-time "2026-05-26T17:40:00Z"
   ```
4. **Update App Target Configuration**: Update the backend `DATABASE_URL` environment variables in AWS Secrets Manager to point to `prod-flow-db-restored`.
5. **Redraw Tasks**: Restart the ECS web tasks to load the restored database connections.
6. **Lift Lockdown**: Audit database connections, and release the Emergency Lockdown once systems are verified as nominal.
