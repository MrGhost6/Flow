import { getPrisma } from "../../database/prisma";
import { getUser, getUserWallets } from "../../lib/dbHelpers";
import { toDecimal, fmtDecimal } from "../../common/utils/decimal";
import Decimal from "decimal.js";
import { auditLog } from "../../common/utils/audit";
import { transactionsTotal } from "../../database/prometheus";

export async function getWallets(userId: string) {
  return getUserWallets(userId);
}

export async function getWallet(userId: string, walletId: string) {
  const w = await getUserWallets(userId);
  const wallet = w.find((x: any) => x.id === walletId);
  if (!wallet) throw Object.assign(new Error("Wallet not found"), { statusCode: 404 });
  return wallet;
}

export async function getWalletTransactions(userId: string, walletId: string) {
  const { getUserTransactions } = await import("../../lib/dbHelpers");
  const txs = await getUserTransactions(userId);
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const wallet = await p.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) throw Object.assign(new Error("Wallet not found"), { statusCode: 404 });
  return txs.filter((t: any) => t.currency === wallet.currency || t.walletId === walletId);
}

export async function exchangeCurrency(userId: string, body: any) {
  const { fromCurrency, toCurrency, amount } = body;
  const dAmount = toDecimal(amount);
  if (dAmount.isZero() || dAmount.isNegative()) throw Object.assign(new Error("Invalid amount"), { statusCode: 400 });
  const wallets = await getUserWallets(userId);
  const sender = wallets.find((w: any) => w.currency === fromCurrency);
  const receiver = wallets.find((w: any) => w.currency === toCurrency);
  if (!sender || !receiver) throw Object.assign(new Error("Wallet not found"), { statusCode: 400 });
  if (toDecimal(sender.balance).lessThan(dAmount)) throw Object.assign(new Error("Insufficient funds"), { statusCode: 400 });
  const rates: Record<string, any> = { USD: new Decimal(1), EUR: new Decimal(0.92), MAD: new Decimal(10.05) };
  const amountUSD = dAmount.div(rates[fromCurrency]);
  const converted = amountUSD.mul(rates[toCurrency]);
  const fee = converted.mul(0.001);
  const finalAmount = converted.minus(fee);
  sender.balance = fmtDecimal(toDecimal(sender.balance).minus(dAmount));
  receiver.balance = fmtDecimal(toDecimal(receiver.balance).plus(finalAmount));
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.wallet.update({ where: { id: sender.id }, data: { balance: sender.balance, ledgerBalance: sender.balance } });
  await p.wallet.update({ where: { id: receiver.id }, data: { balance: receiver.balance, ledgerBalance: receiver.balance } });
  await auditLog(userId, "CURRENCY_EXCHANGE", "WALLET", `Exchanged ${fromCurrency} ${amount} to ${toCurrency} ${fmtDecimal(finalAmount)}`);
  return { senderWallet: sender, receiverWallet: receiver, credited: fmtDecimal(finalAmount), fee: fmtDecimal(fee) };
}

export async function updateWalletLimits(userId: string, walletId: string, body: any) {
  const { dailyLimit, monthlyLimit } = body;
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.wallet.update({ where: { id: walletId }, data: { ...dailyLimit && { dailyLimit }, ...monthlyLimit && { monthlyLimit } } });
}
