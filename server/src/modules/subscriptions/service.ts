import { getPrisma } from "../../database/prisma";
import { toDecimal, fmtDecimal } from "../../common/utils/decimal";

export async function list(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.subscription.findMany({ where: { userId }, orderBy: { nextBillingDate: "asc" } });
}

export async function get(userId: string, id: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.subscription.findFirst({ where: { id, userId } });
}

export async function update(userId: string, id: string, body: any) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.description) data.description = body.description;
  if (body.amount) data.amount = fmtDecimal(toDecimal(body.amount));
  if (body.billingCycle) data.billingCycle = body.billingCycle;
  if (body.status) data.status = body.status;
  if (body.nextBillingDate) data.nextBillingDate = new Date(body.nextBillingDate);
  if (body.status === "CANCELLED" || body.status === "cancelled") data.cancelledAt = new Date();
  return p.subscription.update({ where: { id }, data });
}
