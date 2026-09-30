# FLOW

A multi-currency wallet and payments app I built as a portfolio project. It covers virtual
cards, transfers, split bills, QR payments, budgets, and a spending dashboard, with an
Express + Prisma backend and a React frontend.

## Stack

**Frontend** — React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, Recharts

**Backend** — Express, TypeScript, Prisma, PostgreSQL, Redis (ioredis), BullMQ

**Other** — Gemini API for the AI assistant, prom-client for metrics, MinIO for file
storage, nodemailer for email, Vitest for tests

## Getting started

You need Node.js 20+ and a PostgreSQL and Redis instance running locally.

```bash
npm install
cp .env.example .env      # then fill in the values
npm run db:generate
npm run db:push           # creates the tables from prisma/schema.prisma
npm run dev               # starts the API on :3000 and the app on :5173
```

The app is at http://localhost:5173, the API at http://localhost:3000/api/v1.

`GEMINI_API_KEY` is optional. Without it the AI assistant endpoints fall back to local
results instead of calling the model.

### Scripts

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Runs the API and Vite together |
| `npm run dev:api` | API only, with reload |
| `npm run dev:web` | Frontend only |
| `npm run build` | Builds the frontend, then bundles the server |
| `npm start` | Runs the production bundle |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run db:push` | Syncs the schema to the database |
| `npm run db:generate` | Regenerates the Prisma client |
| `npm run db:studio` | Opens Prisma Studio |

## Project layout

```
server.ts              Express entry point, middleware, route mounting
prisma/schema.prisma   Database schema
server/src/
  config/              Environment config
  database/            Prisma, Redis, MinIO, BullMQ, prom-client setup
  lib/                 JWT, OTP, Gemini client, DB helpers
  common/              Middleware, validators, error handling, utils
  modules/             One folder per domain: routes, controller, service
src/
  components/          UI, grouped by feature area
  stores/              Zustand stores, one per feature
  utils/               API client
  types.ts             Shared TypeScript interfaces
```

The backend is split by domain module. Each module has a `routes.ts` that declares the
endpoints, a `controller.ts` for request handling, and a `service.ts` for the actual
database work. That keeps the route definitions separate from the business logic.

## How it works

**Auth** is JWT-based with access and refresh tokens. Tokens are signed with
`jsonwebtoken`, passwords are hashed with bcrypt, and there is an OTP step for email
verification and password resets. A middleware on the API router checks the token and
attaches the user id to the request.

**Money** is stored as `Decimal(20, 2)` rather than a float, so currency arithmetic
doesn't drift. A transfer debits one wallet and credits another inside a single database
transaction, so a failure partway through rolls back both sides.

**Background work** goes through BullMQ. Email delivery, notifications, and fraud scoring
run on queues backed by Redis rather than blocking the request that triggered them.

**Rate limiting** is applied per route group, with tighter limits on auth endpoints
since those are the ones worth brute forcing.

**Metrics** are collected with prom-client and exposed on `/api/v1/metrics` in Prometheus
format. Health checks for the database, Redis, and the queues are on `/api/v1/health/*`.

## Testing

There's one test file, `src/utils/api.test.ts`, covering the API client's header
handling. The backend modules don't have tests yet, which is the main gap I'd want to
close next. Run them with `npm test`.

## Things I'd do differently

- Add tests for the transaction and wallet services. That's where the logic that actually
  matters lives, and it's currently untested.
- The components are large. `App.tsx` and `PaymentHub.tsx` in particular should be split
  up before they get any harder to work with.
- The ledger is a single Postgres table set. It'd be worth thinking about how it grows
  past one database's write throughput.
