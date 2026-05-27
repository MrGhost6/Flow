import { v4 as uuidv4 } from "uuid";
import { getPrisma } from "../../database/prisma";
import { auditLog } from "../../common/utils/audit";
import { getUser } from "../../lib/dbHelpers";
import { getQueue } from "../../database/bullmq";

export async function getOverview(userId: string) {
  const user: any = await getUser(userId);
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const sessions = await p.userSession.findMany({ where: { userId } });
  return { twoFactorEnabled: user?.twoFactorEnabled || false, biometricEnabled: user?.biometricEnabled || false, devicesCount: 0, activeSessions: sessions.length, lastLogin: user?.lastLogin || new Date().toISOString(), securityScore: 85, riskLevel: "low" };
}

export async function getDevices(_userId?: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.userSession.findMany({ where: { isActive: true } });
}

export async function getSessions(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.userSession.findMany({ where: { userId } });
}

export async function getLoginHistory(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.userSession.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 });
}

export async function getFraudEvents(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.fraudEvent.findMany({ where: { userId }, orderBy: { detectedAt: "desc" } });
}

export async function emergencyFreeze(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.user.update({ where: { id: userId }, data: { status: "frozen" as any } });
  await auditLog(userId, "EMERGENCY_FREEZE", "SECURITY", "User initiated emergency account freeze");
  const q = getQueue("email");
  if (q) await q.add("account-freeze", { userId, time: new Date().toISOString() });
}

export async function emergencyThaw(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.user.update({ where: { id: userId }, data: { status: "active" as any } });
  await auditLog(userId, "EMERGENCY_THAW", "SECURITY", "Account unfrozen by user");
}

export async function requestBiometric(_userId?: string) {
  return { challenge: uuidv4(), expiresAt: new Date(Date.now() + 120000).toISOString() };
}

export async function enableBiometric(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.user.update({ where: { id: userId }, data: { biometricEnabled: true } });
  await auditLog(userId, "BIOMETRIC_ENABLED", "SECURITY", "Biometric authentication enabled");
}

export async function disableBiometric(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.user.update({ where: { id: userId }, data: { biometricEnabled: false } });
  await auditLog(userId, "BIOMETRIC_DISABLED", "SECURITY", "Biometric authentication disabled");
}

export async function enable2FA(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.user.update({ where: { id: userId }, data: { twoFactorEnabled: true, twoFactorSecret: uuidv4() } });
  await auditLog(userId, "2FA_ENABLED", "SECURITY", "Two-factor authentication enabled");
}

export async function disable2FA(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
  await auditLog(userId, "2FA_DISABLED", "SECURITY", "Two-factor authentication disabled");
}
