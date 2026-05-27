import { getPrisma } from "../../database/prisma";
import { toDecimal, fmtDecimal } from "../../common/utils/decimal";
import { v4 as uuidv4 } from "uuid";

export async function list(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.budget.findMany({ where: { userId, isActive: true }, orderBy: { createdAt: "desc" } });
}

export async function create(userId: string, body: any) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const now = new Date();
  let startDate = now;
  let endDate: Date | null = null;
  const period = body.period || "MONTHLY";
  if (period === "MONTHLY") endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  else if (period === "WEEKLY") endDate = new Date(now.getTime() + 7 * 86400000);
  else if (period === "YEARLY") endDate = new Date(now.getFullYear() + 1, 0, 0);
  else if (period === "DAILY") endDate = new Date(now.getTime() + 86400000);
  const budget = await p.budget.create({
    data: {
      id: `budget-${uuidv4().slice(0, 8)}`,
      userId,
      name: body.name,
      amount: fmtDecimal(toDecimal(body.amount)),
      period: period as any,
      startDate,
      endDate,
      spent: 0,
      isActive: true,
    },
  });
  return budget;
}

export async function remove(userId: string, id: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.budget.delete({ where: { id } });
}
