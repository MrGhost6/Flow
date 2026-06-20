import crypto from "crypto";
import { getPrisma } from "../../database/prisma";
import { getUser, getUserTransactions, getUserWallets } from "../../lib/dbHelpers";
import { toDecimal, fmtDecimal } from "../../common/utils/decimal";
import { auditLog } from "../../common/utils/audit";
import { transactionsTotal } from "../../database/prometheus";
import { getQueue } from "../../database/bullmq";

export async function sendTransfer(userId: string, body: any) {
  const dAmount = toDecimal(body.amount);
  if (dAmount.isZero() || dAmount.isNegative()) throw Object.assign(new Error("Invalid amount"), { statusCode: 400 });
  const user: any = await getUser(userId);
  if (!user || ["FROZEN", "SUSPENDED"].includes(user.status)) throw Object.assign(new Error("Account frozen"), { statusCode: 403 });
  const currency = body.currency || "MAD";
  const wallets = await getUserWallets(userId);
  const source = wallets.find((w: any) => (body.senderWalletId && w.id === body.senderWalletId) || w.currency === currency);
  if (!source) throw Object.assign(new Error(`No ${currency} wallet`), { statusCode: 400 });
  if (!source.isActive) throw Object.assign(new Error("Wallet frozen"), { statusCode: 403 });
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  if (toDecimal(source.balance).lessThan(dAmount)) {
    await p.transaction.create({ data: { id: `tx-${Date.now()}`, walletId: source.id, type: "TRANSFER", status: "FAILED", amount: dAmount.toNumber(), currency: currency as any, reference: `FLOW-FAIL-${Date.now()}`, description: `Failed: ${body.receiverIdentifier}` } });
    transactionsTotal.inc({ type: "transfer", status: "failed", currency });
    throw Object.assign(new Error("Insufficient funds"), { statusCode: 400 });
  }
  const isSuspicious = dAmount.gte(40000);
  if (isSuspicious) {
    await auditLog(userId, "SUSPICIOUS_TRANSFER", "SECURITY", `Large transfer: ${currency} ${dAmount}`);
    const fq = getQueue("fraud");
    if (fq) await fq.add("high-value-transfer", { userId, amount: dAmount.toNumber(), currency, receiverId: body.receiverIdentifier });
  }
  const ref = `FLOW-${Date.now()}-${crypto.randomInt(1000, 9999)}`;
  const txStatus = isSuspicious ? "PENDING" : "COMPLETED";
  const tx: any = { id: `tx-${Date.now()}`, userId, date: new Date().toISOString().split("T")[0], description: body.description || `Transfer to ${body.receiverIdentifier}`, amount: dAmount.toNumber(), type: "expense", currency, status: isSuspicious ? "processing" : "success", reference: ref, fee: 0 };
  await p.transaction.create({ data: { id: tx.id, walletId: source.id, type: "TRANSFER", status: txStatus, amount: dAmount.toNumber(), currency: currency as any, reference: ref, description: tx.description } });
  source.balance = toDecimal(source.balance).minus(dAmount).toNumber() as any;
  await p.wallet.update({ where: { id: source.id }, data: { balance: source.balance } });
  transactionsTotal.inc({ type: "transfer", status: "success", currency });
  await auditLog(userId, "TRANSFER_SENT", "TRANSACTION", `${currency} ${dAmount} to ${body.receiverIdentifier}`);
  return { transaction: tx, sourceWallet: source };
}

export async function validateTransfer(userId: string, body: any) {
  const dAmt = toDecimal(body.amount);
  const wallets = await getUserWallets(userId);
  const wallet = wallets.find((w: any) => w.currency === (body.currency || "MAD"));
  const sufficient = wallet ? toDecimal(wallet.balance).greaterThanOrEqualTo(dAmt) : false;
  return { valid: sufficient, balance: wallet?.balance || 0, required: dAmt.toNumber() };
}

export async function getHistory(userId: string) {
  return getUserTransactions(userId);
}

export async function search(userId: string, q: string) {
  const txs = await getUserTransactions(userId);
  const lower = q.toLowerCase();
  return txs.filter((t: any) => t.description?.toLowerCase().includes(lower) || t.reference?.toLowerCase().includes(lower));
}

export async function filter(userId: string, query: any) {
  let txs = await getUserTransactions(userId);
  if (query.category) txs = txs.filter((t: any) => t.categoryId === query.category);
  if (query.type) txs = txs.filter((t: any) => t.type === query.type);
  if (query.status) txs = txs.filter((t: any) => t.status === query.status);
  if (query.currency) txs = txs.filter((t: any) => t.currency === query.currency);
  return txs;
}

export async function getById(txId: string, userId?: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const tx = await p.transaction.findUnique({ where: { id: txId } });
  if (!tx) throw Object.assign(new Error("Transaction not found"), { statusCode: 404 });
  const wallets = await getUserWallets(userId || "");
  if (!wallets.some((w: any) => w.id === tx.walletId)) throw Object.assign(new Error("Transaction not found"), { statusCode: 404 });
  return tx;
}

export async function getReceipt(txId: string, userId?: string) {
  const tx = await getById(txId, userId);
  return { receipt: tx, merchant: "FLOW Financial", receiptId: `RCP-${tx.id}`, issuedAt: new Date().toISOString() };
}

export async function updateCategory(txId: string, category: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.transaction.update({ where: { id: txId }, data: { categoryId: category } });
}
