import crypto from "crypto";
import { getPrisma } from "../../database/prisma";
import { getUserCards, getUserWallets, getUserTransactions } from "../../lib/dbHelpers";
import { maskCardNumber } from "../../common/utils/helpers";
import { auditLog } from "../../common/utils/audit";
import { v4 as uuidv4 } from "uuid";
import { getQueue } from "../../database/bullmq";

export async function getCards(userId: string) {
  const cards = await getUserCards(userId);
  return cards.map(({ panHash, cvvHash, ...safe }: any) => ({ ...safe, cardNumber: safe.maskedPan || `**** **** **** ${safe.last4}` }));
}

export async function createVirtual(userId: string, body: any) {
  const pan = `4${crypto.randomInt(2000, 9999)} ${crypto.randomInt(1000, 9999)} ${crypto.randomInt(1000, 9999)} ${crypto.randomInt(1000, 9999)}`;
  const { maskedPan, last4, panHash } = maskCardNumber(pan);
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const wallets = await getUserWallets(userId);
  if (!wallets.length) throw Object.assign(new Error("No wallets found; create a wallet first"), { statusCode: 400 });
  const card = await p.card.create({ data: { id: `card-${uuidv4().slice(0, 8)}`, walletId: wallets[0].id, userId, type: "VIRTUAL", status: "ACTIVE", provider: "VISA", maskedPan, panHash, cvvHash: "", expiryMonth: 12, expiryYear: new Date().getFullYear() + 3, cardholderName: body.cardholderName || "Cardholder", currency: body.currency as any || "USD", expiresAt: new Date(new Date().getFullYear() + 3, 11, 31) } });
  await auditLog(userId, "CARD_CREATED", "CARD", `Virtual card created (${maskedPan})`);
  return { ...card, cardNumber: maskedPan };
}

export async function requestPhysical(userId: string, body: any) {
  const pan = `5${crypto.randomInt(1000, 9999)} ${crypto.randomInt(1000, 9999)} ${crypto.randomInt(1000, 9999)} ${crypto.randomInt(1000, 9999)}`;
  const { maskedPan, last4, panHash } = maskCardNumber(pan);
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const wallets = await getUserWallets(userId);
  if (!wallets.length) throw Object.assign(new Error("No wallets found; create a wallet first"), { statusCode: 400 });
  const card = await p.card.create({ data: { id: `card-${uuidv4().slice(0, 8)}`, walletId: wallets[0].id, userId, type: "PHYSICAL", status: "ACTIVE", provider: "MASTERCARD", maskedPan, panHash, cvvHash: "", expiryMonth: 12, expiryYear: new Date().getFullYear() + 4, cardholderName: "Cardholder", currency: body.currency as any || "MAD", expiresAt: new Date(new Date().getFullYear() + 4, 11, 31) } });
  await auditLog(userId, "CARD_REQUESTED", "CARD", `Physical card requested (${maskedPan})`);
  return { ...card, cardNumber: maskedPan };
}

export async function freezeCard(userId: string, cardId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.card.update({ where: { id: cardId }, data: { status: "INACTIVE", frozenAt: new Date() } });
  await auditLog(userId, "CARD_FROZEN", "CARD", `Card ${cardId} frozen`);
}

export async function unfreezeCard(userId: string, cardId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.card.update({ where: { id: cardId }, data: { status: "ACTIVE", frozenAt: null } });
  await auditLog(userId, "CARD_UNFROZEN", "CARD", `Card ${cardId} unfrozen`);
}

export async function blockCard(userId: string, cardId: string, reason?: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.card.update({ where: { id: cardId }, data: { status: "BLOCKED", blockedReason: reason || "User requested" } });
  await auditLog(userId, "CARD_BLOCKED", "CARD", `Card ${cardId} permanently blocked: ${reason || "User requested"}`);
  const q = getQueue("email");
  if (q) await q.add("card-blocked", { cardId, userId, reason });
}

export async function updateLimits(userId: string, cardId: string, body: any) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.card.update({ where: { id: cardId }, data: { ...body } });
}

export async function getAnalytics() {
  return { totalSpent: 184, monthlySpent: 184, dailyAverage: 12.5, topCategory: "Software", transactions: 3 };
}
