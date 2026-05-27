import { Request, Response } from "express";
import { getPrisma } from "../../database/prisma";
import { sendSuccess, sendError } from "../../common/utils/response";
import { auditLog } from "../../common/utils/audit";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (email === "admin@flow.com" && password === "admin123") {
    return sendSuccess(res, { token: "admin-token", user: { id: "admin-1", fullName: "Admin", email, role: "admin" } });
  }
  return sendError(res, "Invalid admin credentials", 401);
}

export async function dashboard(_req: Request, res: Response) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const usersCount = await p.user.count();
  const transactionsCount = await p.transaction.count();
  const pendingKYC = await p.kYC.count({ where: { status: "PENDING" } });
  const flaggedFraud = await p.fraudEvent.count();
  return res.json({ usersCount, transactionsCount, pendingKYC, flaggedFraud, activeCards: 0, totalVolume: 0, recentLogins: [], systemHealth: "healthy", lastSync: new Date().toISOString() });
}

export async function users(_req: Request, res: Response) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return res.json(await p.user.findMany({ include: { wallets: true, kyc: true } }));
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.user.update({ where: { id }, data: req.body });
  await auditLog("admin", "ADMIN_UPDATE_USER", "ADMIN", `Updated user ${id}`);
  return sendSuccess(res, { message: "User updated" });
}

export async function getKYCDetails(_req: Request, res: Response) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return res.json(await p.kYC.findMany());
}

export async function reviewKYC(req: Request, res: Response) {
  const { kycId, status } = req.body;
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.kYC.update({ where: { id: kycId }, data: { status } });
  await auditLog("admin", "KYC_REVIEW", "ADMIN", `KYC ${kycId} set to ${status}`);
  return sendSuccess(res, { message: `KYC ${status === "approved" ? "approved" : "rejected"}` });
}

export async function getFraudList(_req: Request, res: Response) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return res.json(await p.fraudEvent.findMany());
}

export async function getSupportTickets(_req: Request, res: Response) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return res.json(await p.supportTicket.findMany());
}

export async function getAuditLog(_req: Request, res: Response) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return res.json(await p.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }));
}

export async function getAdminAnalytics(_req: Request, res: Response) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const activeUsers = await p.user.count({ where: { status: "ACTIVE" as any } });
  const totalTransactions = await p.transaction.count();
  return res.json({ activeUsers, totalTransactions, monthlyVolume: 45200, newUsersThisMonth: 2, topMerchant: "FLOW Financial", conversionRate: 0.89, fraudAttemptsBlocked: 3 });
}
