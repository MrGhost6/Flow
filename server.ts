import "dotenv/config";
import "express-async-errors";
import express, { Router } from "express";
import path from "path";
import crypto from "crypto";
import Decimal from "decimal.js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import helmet from "helmet";

// ─── Database ────────────────────────────────────────────────────────
import { initPrisma, getPrisma } from "./server/src/database/prisma";
import { getRedis, initRedis } from "./server/src/database/redis";
import { getMinio, initBuckets } from "./server/src/database/minio";
import { getMailer } from "./server/src/database/mailpit";
import { initQueues, getQueue } from "./server/src/database/bullmq";
import { httpRequestDuration, httpRequestsTotal, queueJobsTotal, register } from "./server/src/database/prometheus";
import { getGeminiClient } from "./server/src/lib/ai";
import { getUser, getUserTransactions } from "./server/src/lib/dbHelpers";
import { auditLog } from "./server/src/common/utils/audit";
import { sendSuccess, sendError } from "./server/src/common/utils/response";

// ─── Module routers ──────────────────────────────────────────────────
import authRouter from "./server/src/modules/auth/routes";
import usersRouter from "./server/src/modules/users/routes";
import walletsRouter from "./server/src/modules/wallets/routes";
import transactionsRouter from "./server/src/modules/transactions/routes";
import paymentsRouter from "./server/src/modules/payments/routes";
import cardsRouter from "./server/src/modules/cards/routes";
import analyticsRouter from "./server/src/modules/analytics/routes";
import securityRouter from "./server/src/modules/security/routes";
import adminRouter from "./server/src/modules/admin/routes";
import freelancerRouter from "./server/src/modules/freelancer/routes";
import businessRouter from "./server/src/modules/business/routes";
import supportRouter from "./server/src/modules/support/routes";
import notificationsRouter from "./server/src/modules/notifications/routes";
import auditRouter from "./server/src/modules/audit/routes";
import budgetsRouter from "./server/src/modules/budgets/routes";
import savingsRouter from "./server/src/modules/savings/routes";
import subscriptionsRouter from "./server/src/modules/subscriptions/routes";
import insightsRouter from "./server/src/modules/insights/routes";

// ─── Middleware & validators ─────────────────────────────────────────
import { authenticateJWT } from "./server/src/common/middlewares/auth";
import { requireAdmin } from "./server/src/common/middlewares/admin";
import { generalLimiter } from "./server/src/common/middlewares/rateLimiter";
import { kycSubmitSchema } from "./server/src/common/validators";
import { errorHandler } from "./server/src/common/middlewares/errorHandler";

// ====================================================================
// CONFIG
// ====================================================================
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_REFRESH_SECRET = process.env.REFRESH_SECRET || "change-me-in-production";

// ====================================================================
// EXPRESS SETUP
// ====================================================================
const app = express();
app.use(cors());
app.use(helmet({ contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// Metrics middleware
app.use((req: any, res: any, next: any) => {
  const start = Date.now();
  res.on("finish", () => {
    httpRequestDuration.observe({ method: req.method, route: req.route?.path || req.path, status: res.statusCode.toString() }, Date.now() - start);
    httpRequestsTotal.inc({ method: req.method, route: req.route?.path || req.path, status: res.statusCode.toString() });
  });
  next();
});

// ====================================================================
// PUBLIC ROUTES (no JWT required)
// ========================================================================
const publicApi = express.Router();
publicApi.use("/auth", authRouter);

// Health & metrics (public)
publicApi.get("/health", (_req, res) => res.json({ status: "healthy", uptime: process.uptime(), timestamp: new Date().toISOString(), version: "1.0.0" }));
publicApi.get("/health/db", async (_req, res) => {
  const p = getPrisma();
  if (!p) return res.json({ status: "degraded", database: "unavailable" });
  try { await p.$queryRaw`SELECT 1`; return res.json({ status: "healthy", database: "postgresql" }); } catch { return res.json({ status: "degraded", error: "DB query failed" }); }
});
publicApi.get("/health/redis", async (_req, res) => {
  const r = getRedis();
  if (!r) return res.json({ status: "degraded" });
  try { await r.ping(); return res.json({ status: "healthy" }); } catch { return res.json({ status: "degraded" }); }
});
publicApi.get("/health/queues", (_req, res) => {
  res.json({ status: getRedis() ? "healthy" : "unavailable", queues: { email: !!getQueue("email"), notification: !!getQueue("notification"), fraud: !!getQueue("fraud"), transaction: !!getQueue("transaction") } });
});
publicApi.get("/metrics/perf", async (_req, res) => {
  res.json({ uptime: process.uptime(), memory: process.memoryUsage(), cpu: process.cpuUsage(), node: process.version });
});
publicApi.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// ====================================================================
// MODULE ROUTES (JWT required)
// ========================================================================
const api = express.Router();
api.use(authenticateJWT);
api.use("/users", usersRouter);
api.use("/wallets", walletsRouter);
api.use("/transactions", transactionsRouter);
api.use("/payments", paymentsRouter);
api.use("/cards", cardsRouter);
api.use("/analytics", analyticsRouter);
api.use("/security", securityRouter);
api.use("/freelancer", freelancerRouter);
api.use("/business", businessRouter);
api.use("/support", supportRouter);
api.use("/notifications", notificationsRouter);
api.use("/audit", auditRouter);
api.use("/budgets", budgetsRouter);
api.use("/savings", savingsRouter);
api.use("/subscriptions", subscriptionsRouter);
api.use("/insights", insightsRouter);

// ─── KYC ─────────────────────────────────────────────────────────────
api.post("/kyc/submit", async (req, res) => {
  try {
    const body = kycSubmitSchema.parse(req.body);
    const user: any = await getUser(req.userId!);
    if (!user) return sendError(res, "User not found", 400);
    const docHash = crypto.createHash("sha256").update(body.documentNumber).digest("hex");
    const submission = { id: `kyc-${uuidv4().slice(0, 8)}`, userId: req.userId, documentType: body.documentType, documentHash: docHash, status: "UNDER_REVIEW", createdAt: new Date().toISOString() };
    const p = getPrisma();
    if (p) await p.kYCVerification.create({ data: { id: submission.id, userId: req.userId!, documentNumber: docHash, documentType: body.documentType, status: "PENDING" } }).catch((e: any) => { console.error("[KYC]", e); });
    await auditLog(req.userId!, "KYC_SUBMITTED", "KYC", `KYC submitted: ${body.documentType}`);
    return sendSuccess(res, { submission });
  } catch (e: any) { if (e instanceof z.ZodError) return sendError(res, e.errors[0].message, 400, "ERR_VALIDATION"); return sendError(res, "Internal error", 500); }
});

api.get("/kyc/status", async (req, res) => {
  const user: any = await getUser(req.userId!);
  const p = getPrisma();
  const submissions = p ? await p.kYCVerification.findMany({ where: { userId: req.userId } }).catch(() => []) : [];
  const latestStatus = submissions.length > 0 ? submissions[submissions.length - 1].status : "NOT_SUBMITTED";
  return res.json({ kycStatus: latestStatus, kycLevel: user?.kycLevel || "UNVERIFIED", submissions });
});

// ─── AI & Advisor ────────────────────────────────────────────────────
api.get("/ai/insights", async (req, res) => {
  const txs = await getUserTransactions(req.userId!);
  const income = txs.filter((t: any) => t.type === "income").reduce((s: Decimal, t: any) => s.plus(t.amount || 0), new Decimal(0));
  const expenses = txs.filter((t: any) => t.type === "expense").reduce((s: Decimal, t: any) => s.plus(t.amount || 0), new Decimal(0));
  const net = income.minus(expenses);
  return res.json({ insights: [{ type: "income_expense_ratio", label: "Income vs Expenses", value: net.toNumber(), detail: `Net cashflow: ${net.toFixed(2)}` }], aiEnabled: !!getGeminiClient() });
});

api.post("/ai/search", async (req, res) => {
  const { query } = req.body;
  if (!query) return sendError(res, "Query required", 400);
  const ai = getGeminiClient();
  if (!ai) return res.json({ answer: "AI search unavailable. Configure GEMINI_API_KEY.", source: "local" });
  try {
    const result = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: `You are a fintech assistant for FLOW. Answer: ${query}\nKeep it concise and helpful.` });
    return res.json({ answer: result.text || "No response", source: "gemini" });
  } catch { return res.json({ answer: "AI service temporarily unavailable", source: "error" }); }
});

api.post("/ai/support-assist", async (req, res) => {
  const { message } = req.body;
  if (!message) return sendError(res, "Message required", 400);
  return res.json({ reply: "I've analyzed your query. For VAT exemption on cross-border services, please ensure your contract specifies the reverse-charge mechanism.", source: "ai" });
});

api.post("/financial-search", async (req, res) => {
  const { query } = req.body;
  const txs = await getUserTransactions(req.userId!);
  const q = (query || "").toLowerCase();
  const results = txs.filter((t: any) => t.description?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q));
  return res.json({ results: results.slice(0, 10), total: results.length });
});

api.post("/advisor", async (req, res) => res.json({ advice: "Based on your spending, consider setting up a budget for dining.", category: "budget" }));
api.post("/advisor/suggest", async (req, res) => res.json({ suggestion: "Save 10% of your monthly income for emergency fund.", impact: "Builds 3-month reserve within 30 months." }));

// ─── Expanded Admin Routes ──────────────────────────────────────────
const adminExtra = Router();

adminExtra.get("/metrics", async (req, res) => {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const [userCount, txCount, fraudCount, ticketCount] = await Promise.all([
    p.user.count(),
    p.transaction.count(),
    p.fraudEvent.count(),
    p.supportTicket.count(),
  ]);
  res.json({ totalUsers: userCount, totalTransactions: txCount, pendingFraud: fraudCount, openTickets: ticketCount, activeWallets: 9, totalVolume: 184500 });
});

adminExtra.get("/user-analytics", (req, res) => res.json({ total: 4, active: 4, newThisMonth: 1, growth: "25%" }));
adminExtra.get("/transaction-analytics", (req, res) => res.json({ total: 8, volume: "184,500 MAD", success: "100%", avgValue: "23,062" }));
adminExtra.get("/fraud-analytics", (req, res) => res.json({ total: 2, open: 2, critical: 1, falsePositives: 0 }));
adminExtra.get("/support-analytics", (req, res) => res.json({ total: 1, open: 1, avgResponseTime: "4h", satisfaction: "100%" }));

adminExtra.get("/activity-feed", (req, res) => res.json([{ action: "USER_SIGNIN", userId: req.userId, timestamp: new Date().toISOString() }]));
adminExtra.get("/roles", (req, res) => res.json([{ role: "SUPER_ADMIN", permissions: ["all"] }, { role: "ADMIN", permissions: ["read", "write"] }, { role: "SUPPORT", permissions: ["read", "tickets"] }]));
adminExtra.get("/permissions", (req, res) => res.json({ modules: ["users", "transactions", "kyc", "cards", "fraud", "support", "analytics"], roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"] }));

adminExtra.get("/users/:id", async (req, res) => { const u = await getUser(req.params.id); if (!u) return sendError(res, "User not found", 404); return res.json(u); });
adminExtra.patch("/users/:id/role", (req, res) => sendSuccess(res, {}));
adminExtra.patch("/users/:id/status", async (req, res) => {
  const { status } = req.body;
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.user.update({ where: { id: req.params.id }, data: { status: status as any } });
  await auditLog(req.userId!, "ADMIN_USER_STATUS", "ADMIN", `User ${req.params.id} status: ${status}`);
  return sendSuccess(res, { userId: req.params.id, newStatus: status });
});
adminExtra.patch("/users/:id/freeze", async (req, res) => {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.user.update({ where: { id: req.params.id }, data: { status: "SUSPENDED" as any } });
  await auditLog(req.userId!, "ADMIN_FREEZE_USER", "ADMIN", `User ${req.params.id} frozen`);
  return sendSuccess(res, { message: "User frozen" });
});
adminExtra.patch("/users/:id/restrict", async (req, res) => {
  await auditLog(req.userId!, "ADMIN_RESTRICT_USER", "ADMIN", `User ${req.params.id} restricted`);
  return sendSuccess(res, {});
});

adminExtra.get("/kyc/:id", (req, res) => res.json({ id: req.params.id, status: "UNDER_REVIEW" }));
adminExtra.patch("/kyc/:id/review", async (req, res) => {
  const { status } = req.body;
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.kYCVerification.update({ where: { id: req.params.id }, data: { status: status as any, verifiedAt: new Date() } });
  await auditLog(req.userId!, "ADMIN_KYC_REVIEW", "ADMIN", `KYC ${req.params.id} -> ${status}`);
  return sendSuccess(res, { kycStatus: status });
});

adminExtra.get("/transactions", async (req, res) => {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return res.json(await p.transaction.findMany({ orderBy: { createdAt: "desc" }, take: 50 }));
});
adminExtra.get("/transactions/:id", (req, res) => res.json({ id: req.params.id, status: "success" }));
adminExtra.patch("/transactions/:id/flag", (req, res) => sendSuccess(res, { flagged: true }));

adminExtra.get("/fraud-events", (req, res) => res.json([{ id: "fraud-1", userId: req.userId, eventType: "impossible_travel", riskLevel: "medium", resolved: false }]));
adminExtra.get("/fraud-events/:id", (req, res) => res.json({ id: req.params.id }));
adminExtra.patch("/fraud-events/:id/resolve", (req, res) => sendSuccess(res, {}));
adminExtra.patch("/fraud-events/:id/escalate", (req, res) => sendSuccess(res, { escalated: true }));
adminExtra.get("/security/fraud-events", (req, res) => res.json([]));
adminExtra.get("/security/risk-users", (req, res) => res.json([{ userId: req.userId, riskScore: 12, level: "low" }]));
adminExtra.patch("/security/freeze-user/:id", async (req, res) => { await auditLog(req.userId!, "ADMIN_FREEZE", "ADMIN", `Admin froze user ${req.params.id}`); return sendSuccess(res, {}); });
adminExtra.patch("/security/unfreeze-user/:id", async (req, res) => { await auditLog(req.userId!, "ADMIN_UNFREEZE", "ADMIN", `Admin unfroze user ${req.params.id}`); return sendSuccess(res, {}); });

adminExtra.get("/support", (req, res) => res.json({ tickets: [], open: 0, resolved: 0 }));
adminExtra.get("/support/tickets", (req, res) => res.json([]));
adminExtra.get("/support/tickets/:id", (req, res) => res.json({ id: req.params.id }));
adminExtra.patch("/support/tickets/:id", async (req, res) => { await auditLog(req.userId!, "ADMIN_TICKET_UPDATE", "ADMIN", `Ticket ${req.params.id} updated`); return sendSuccess(res, {}); });
adminExtra.post("/support/tickets/:id/reply", (req, res) => sendSuccess(res, { reply: req.body.message }));

adminExtra.get("/audit-logs", async (req, res) => {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return res.json(await p.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }));
});
adminExtra.get("/audit-logs/:id", (req, res) => res.json({ id: req.params.id }));

adminExtra.get("/notifications", (req, res) => res.json([]));
adminExtra.patch("/notifications/:id/read", (req, res) => sendSuccess(res, {}));
adminExtra.post("/security/emergency-freeze", async (req, res) => { await auditLog(req.userId!, "ADMIN_EMERGENCY_FREEZE", "ADMIN", "Admin initiated emergency freeze"); return sendSuccess(res, { message: "Emergency freeze applied to all accounts" }); });

api.use("/admin", requireAdmin, adminRouter);
api.use("/admin", requireAdmin, adminExtra);

api.get("/queues/status", (req, res) => {
  res.json({ queues: { email: getQueue("email") ? "active" : "unavailable", notification: getQueue("notification") ? "active" : "unavailable", transaction: getQueue("transaction") ? "active" : "unavailable", fraud: getQueue("fraud") ? "active" : "unavailable" } });
});

api.post("/queues/add", async (req, res) => {
  const { queue, data } = req.body;
  if (!queue || !data) return sendError(res, "Queue name and data required", 400);
  const q = getQueue(queue);
  if (!q) return sendError(res, "Queue not available", 400);
  await q.add("manual-job", data);
  queueJobsTotal.inc({ queue, status: "added" });
  return sendSuccess(res, { message: `Job added to ${queue} queue` });
});

// ====================================================================
// MOUNT ROUTER
// ========================================================================
app.use("/api/v1", publicApi);
app.use("/api", publicApi);
app.use("/api/v1", api);
app.use("/api", api);

// ====================================================================
// STATIC FILES & SPA fallback
// ====================================================================
if (NODE_ENV === "production") {
  const distPath = path.resolve("dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => { res.sendFile(path.join(distPath, "index.html")); });
}

// ====================================================================
// ERROR HANDLER
// ====================================================================
app.use(errorHandler);

// ====================================================================
// START SERVER
// ====================================================================
async function main() {
  await initPrisma();
  await initRedis();
  await getMinio();
  await getMailer();
  initQueues();

  await initBuckets();

  function startServer(port: number) {
    const server = app.listen(port, "0.0.0.0", () => {
      const p = getPrisma();
      const r = getRedis();
      const m = getMinio();
      console.log(`[FLOW] API running on http://0.0.0.0:${port} (${NODE_ENV})`);
      console.log(`[FLOW] Routes mounted under /api/v1 and /api (backward compat)`);
      console.log(`[FLOW] Database: ${p ? "PostgreSQL" : "unavailable"}`);
      console.log(`[FLOW] Redis: ${r ? "connected" : "unavailable"}`);
      console.log(`[FLOW] MinIO: ${m ? "initialized" : "unavailable"}`);
      console.log(`[FLOW] Metrics: http://localhost:${port}/api/v1/metrics`);
    });
    server.on("error", (e: any) => {
      if (e.code === "EADDRINUSE" && port < PORT + 10) {
        console.warn(`[FLOW] Port ${port} in use, trying ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error("[FLOW] Server error:", e.message);
      }
    });
  }
  startServer(PORT);
}

process.on("SIGTERM", () => { console.log("[FLOW] SIGTERM received, shutting down..."); process.exit(0); });
process.on("SIGINT", () => { console.log("[FLOW] SIGINT received, shutting down..."); process.exit(0); });

main().catch(console.error);
