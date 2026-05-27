import { getPrisma } from "../../database/prisma";
import { toDecimal, fmtDecimal } from "../../common/utils/decimal";
import { v4 as uuidv4 } from "uuid";

export async function listGoals(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.savingsGoal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function createGoal(userId: string, body: any) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const goal = await p.savingsGoal.create({
    data: {
      id: `goal-${uuidv4().slice(0, 8)}`,
      userId,
      name: body.title || body.name,
      targetAmount: fmtDecimal(toDecimal(body.targetAmount)),
      currentAmount: 0,
      currency: body.currency || "MAD",
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
    },
  });
  return goal;
}

export async function getGoal(userId: string, id: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.savingsGoal.findFirst({ where: { id, userId } });
}

export async function updateGoal(userId: string, id: string, body: any) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.targetAmount) data.targetAmount = fmtDecimal(toDecimal(body.targetAmount));
  if (body.targetDate) data.targetDate = new Date(body.targetDate);
  return p.savingsGoal.update({ where: { id }, data });
}

export async function contribute(userId: string, id: string, amount: number) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const goal = await p.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) throw new Error("Goal not found");
  const dAmount = toDecimal(amount);
  if (dAmount.isNegative() || dAmount.isZero()) throw new Error("Invalid contribution amount");
  const newCurrent = toDecimal(goal.currentAmount).plus(dAmount);
  const update: any = { currentAmount: fmtDecimal(newCurrent) };
  if (toDecimal(goal.targetAmount).lessThanOrEqualTo(newCurrent)) {
    update.isCompleted = true;
    update.completedAt = new Date();
  }
  return p.savingsGoal.update({ where: { id }, data: update });
}
