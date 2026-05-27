import Decimal from "decimal.js";
import { getUserTransactions, getUserWallets } from "../../lib/dbHelpers";
import { toDecimal, fmtDecimal } from "../../common/utils/decimal";

export async function getOverview(userId: string) {
  const txs = await getUserTransactions(userId);
  const income = txs.filter((t: any) => t.type === "income").reduce((s: Decimal, t: any) => s.plus(toDecimal(t.amount)), new Decimal(0));
  const expenses = txs.filter((t: any) => t.type === "expense").reduce((s: Decimal, t: any) => s.plus(toDecimal(t.amount)), new Decimal(0));
  const wallets = await getUserWallets(userId);
  return { totalIncome: fmtDecimal(income), totalExpenses: fmtDecimal(expenses), netCashflow: fmtDecimal(income.minus(expenses)), balance: fmtDecimal(wallets.reduce((s: Decimal, w: any) => s.plus(toDecimal(w.balance)), new Decimal(0))), transactionCount: txs.length };
}

export async function getSpending(userId: string) {
  const txs = await getUserTransactions(userId);
  const expenses = txs.filter((t: any) => t.type === "expense");
  const total = expenses.reduce((s: Decimal, t: any) => s.plus(toDecimal(t.amount)), new Decimal(0));
  return { totalExpenses: fmtDecimal(total), count: expenses.length, averagePerTx: expenses.length ? fmtDecimal(total.div(expenses.length)) : 0 };
}

export async function getCashflow(userId: string) {
  const txs = await getUserTransactions(userId);
  return txs.slice(0, 12);
}

export async function getTrends(userId: string) {
  const txs = await getUserTransactions(userId);
  return { trends: txs.slice(0, 6) };
}

export async function getCategories(userId: string) {
  const txs = await getUserTransactions(userId);
  const byCat: Record<string, Decimal> = {};
  txs.forEach((t: any) => { const cat = t.category || "other"; byCat[cat] = (byCat[cat] || new Decimal(0)).plus(toDecimal(t.amount)); });
  return Object.entries(byCat).map(([category, amount]) => ({ category, amount: fmtDecimal(amount) }));
}

export async function getMonthlyReport(userId: string) {
  const txs = await getUserTransactions(userId);
  const income = txs.filter((t: any) => t.type === "income").reduce((s: Decimal, t: any) => s.plus(toDecimal(t.amount)), new Decimal(0));
  const expenses = txs.filter((t: any) => t.type === "expense").reduce((s: Decimal, t: any) => s.plus(toDecimal(t.amount)), new Decimal(0));
  return { month: new Date().toISOString().slice(0, 7), income: fmtDecimal(income), expenses: fmtDecimal(expenses), count: txs.length };
}
