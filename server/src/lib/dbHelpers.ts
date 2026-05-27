import { getPrisma } from "../database/prisma";

export async function getUsers() {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.user.findMany();
}

export async function getUser(id: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const u = await p.user.findUnique({ where: { id } });
  if (!u) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  return u;
}

export async function getUserByEmail(email: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function getUserWallets(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.wallet.findMany({ where: { userId } });
}

export async function getUserTransactions(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.transaction.findMany({
    where: { OR: [{ wallet: { userId } }, { senderId: userId }, { recipientId: userId }] },
  });
}

export async function getUserCards(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.card.findMany({ where: { userId } });
}
