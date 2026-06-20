import { getPrisma } from "../../database/prisma";
import { v4 as uuidv4 } from "uuid";

export async function auditLog(
  userId: string | null,
  action: string,
  resource: string,
  description: string,
  severity = "INFO"
) {
  const log = { id: uuidv4(), userId, action, resource, description, severity, timestamp: new Date().toISOString() };
  const prisma = getPrisma();
  if (!prisma) return log;
  try {
    await prisma.auditLog.create({
      data: { id: log.id, userId, action: action as any, resource, description, metadata: { severity } },
    });
  } catch (e) {
    console.error("[AUDIT] Failed to write audit log:", e);
  }
  return log;
}
