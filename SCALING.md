# 📈 FLOW Architecture Horizontal Scaling Strategy

Scaling FLOW safely to process multi-million user ledger volumes without service degradation.

## 1. Split-Worker Application Architecture

Currently, FLOW runs in a single Node block. In step 12, we isolate the application layer from background tasks to allow them to scale independently:

* **HTTP Web Core**: Processes synchronous API calls (balance retrieval, authentication checks, virtual card issuance).
* **BullMQ Async Core**: Runs background workers in separated container tasks to process decoupled asynchronous tasks (email dispatch, statements building, fraud scoring, analytics aggregation).

---

## 2. Microservice Conversion Roadmap

As our user base grows, we will split our backend into specialized domain microservices:

```txt
                              [ API GATEWAY ]
                                     |
    +------------------------+-------+--------+------------------------+
    |                        |                |                        |
[ PAYMENTS SERVICE ]   [ FRAUD DESK ]   [ ANALYTICS HUB ]   [ NOTIFICATIONS SERVICE ]
    |                        |                |                        |
    ↳ (Postgres Sub-DB)      ↳ (Scoring Repos) ↳ (Timescale DB)       ↳ (Pub/Sub Broker)
```

---

## 3. High Performance Caching Guidelines

To preserve database pool resources:

* **Session Token Cache**: Write active JWT token states directly to transient Redis keys set with short TTL expiration policies.
* **Aggregated Balances**: Cache heavy workspace analytics metrics under Redis hashes. Invalidate and re-calculate only when transaction lifecycle webhooks complete.
* **Rate Limiting**: Enforce strict Redis Token-Bucket rate limit policies on customer-facing auth, payment, and wallet APIs.
