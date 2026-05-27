import { getPrisma } from "../../database/prisma";

export async function list(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.aiInsight.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
}

export async function markRead(userId: string, id: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.aiInsight.updateMany({ where: { id, userId }, data: { isRead: true } });
}
