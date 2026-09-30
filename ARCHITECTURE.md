# Architecture

Notes on how FLOW is put together, written to match what's actually in the repo.

## Shape of the system

Two pieces that run in the same process during development and are bundled separately
for production:

```
src/        React SPA, built by Vite into dist/
server.ts   Express API, bundled by esbuild into dist/server.cjs
```

In development Vite runs on :5173 and proxies `/api` through to the API on :3000. In
production the Express server serves the built `dist/` directory and falls back to
`index.html` for client-side routes, so there's one process and one port.

## Backend layout

`server.ts` is the entry point. It sets up middleware, mounts the module routers, and
adds a handful of routes that don't belong to a single domain (KYC submission, AI
endpoints, health checks, metrics).

Everything else lives under `server/src/`:

```
config/       reads process.env once, exported as a single object
database/     Prisma, Redis, MinIO, BullMQ and prom-client clients
lib/          JWT, OTP, Gemini client, shared DB query helpers
common/       middleware, zod validators, error types, small utilities
modules/      the actual feature code
```

Each folder in `modules/` is one domain area and follows the same three-file shape:

| File | Responsibility |
| :--- | :--- |
| `routes.ts` | Declares paths, applies middleware, wires to controller |
| `controller.ts` | Reads the request, calls the service, shapes the response |
| `service.ts` | The business logic and database calls |

There are 18 modules: admin, analytics, audit, auth, budgets, business, cards, freelancer,
insights, notifications, payments, savings, security, subscriptions, support,
transactions, users, wallets.

Most services start with a guard that returns early if Prisma hasn't connected:

```ts
const p = getPrisma();
if (!p) throw new Error("Database unavailable");
```

That lets the server boot and serve health checks even when Postgres is unreachable,
instead of failing at startup.

## Data model

`prisma/schema.prisma` is the source of truth. Money is `Decimal(20, 2)` throughout, and
exchange rates are `Decimal(12, 6)`, because binary floating point doesn't represent
currency amounts exactly.

The central tables:

- `users` — profile, status, KYC level, 2FA flag
- `wallets` — one row per currency a user holds, with `balance` and `ledgerBalance`
- `transactions` — the ledger entries, with type, status, and optional FX rate
- `cards` — virtual cards, limits, freeze state
- `audit_logs` — who did what, appended on security-relevant actions

Relations are declared explicitly with `fields` / `references` where more than one
relation points at the same table, which is why some fields carry a name like
`@relation("WalletTransactions")`.

## Auth

`server/src/lib/jwt.ts` signs and verifies access and refresh tokens. The `authenticateJWT`
middleware in `common/middlewares/auth.ts` runs on the protected router, checks the
bearer token, and sets `req.userId`. `requireAdmin` layers on top of it for the admin
routes.

OTP codes are generated and checked in `lib/otp.ts`, used for email verification and
password resets.

## Errors

Services throw plain `Error` objects with a `statusCode` property attached:

```ts
throw Object.assign(new Error("Wallet not found"), { statusCode: 404 });
```

`common/middlewares/errorHandler.ts` picks that up and converts it into a response. It's
not the most refined pattern, but it keeps the services from importing a response type
just to report a failure.

## Background jobs

BullMQ queues are initialised in `database/bullmq.ts`, backed by Redis. Queues exist for
email, notifications, transactions, and fraud scoring. Work that doesn't need to finish
before the user sees a response gets pushed onto one of these instead of running inline.

## Metrics and health

`database/prometheus.ts` defines a small set of `prom-client` instruments (request
duration histogram, request/transaction/fraud/OTP/queue counters) plus Node's default
process metrics. The registry is exposed at `/api/v1/metrics`.

Health checks are split per dependency at `/api/v1/health/db`, `/health/redis`, and
`/health/queues`, each returning its own status so a failure points at the actual problem.

## Frontend

Zustand stores in `src/stores/`, one per feature. Components read from stores rather than
holding their own copies of server state, so a wallet balance updated by the payments flow
is visible to the dashboard without prop drilling.

`src/utils/api.ts` wraps `fetch` to attach the access token and default `Content-Type` from
`localStorage`. That's the only place the token is read, which makes it the single point to
change if the auth storage strategy changes.

## Known rough edges

- `App.tsx`, `PaymentHub.tsx`, and `AdminPanel.tsx` are large and should be split.
- Several services return in-memory or placeholder data instead of hitting the database
  (the payment request and split bill flows are examples). The routes and types are real,
  the persistence isn't wired up.
- Exchange rates in `wallets/service.ts` are a hardcoded table, not a live feed.
- The backend has no test coverage yet.
