import { v4 as uuidv4 } from "uuid";
import Decimal from "decimal.js";
import { auditLog } from "../../common/utils/audit";
import { toDecimal, fmtDecimal } from "../../common/utils/decimal";

const freelancers: any[] = [];

export async function getClients() { return freelancers; }

export async function addClient(userId: string, body: any) {
  const client: any = { id: `client-${uuidv4().slice(0, 8)}`, userId, name: body.name, email: body.email || `${body.name?.toLowerCase().replace(/\s/g, "")}@example.com`, projects: 0, totalBilled: 0, status: "active", createdAt: new Date().toISOString() };
  freelancers.push(client);
  return client;
}

export async function getInvoices() { return []; }

export async function createInvoice(userId: string, body: any) {
  const inv: any = { id: `inv-${uuidv4().slice(0, 8)}`, userId, client_name: body.clientName || "Client", amount: body.amount, currency: body.currency || "USD", status: "pending", due_date: body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0], created_at: new Date().toISOString(), line_items: body.lineItems || [{ description: "Services", quantity: 1, rate: body.amount }] };
  await auditLog(userId, "INVOICE_CREATED", "FREELANCER", `Invoice ${inv.id} for ${body.amount} ${body.currency || "USD"}`);
  return inv;
}

export async function getEarnings() {
  return { totalEarned: 12500, thisMonth: 3200, pendingPayouts: 1500, currency: "USD", growth: 12.5 };
}

export async function estimateTax(userId: string, body: any) {
  const dIncome = toDecimal(body.income || 50000);
  const rate = new Decimal(0.25);
  const deductions = dIncome.mul(0.1);
  return { grossIncome: body.income || 50000, estimatedTax: fmtDecimal(dIncome.mul(rate)), effectiveRate: 25, deductions: fmtDecimal(deductions), netIncome: fmtDecimal(dIncome.minus(dIncome.mul(rate)).minus(deductions)), disclaimer: "This is an estimate. Consult a tax professional." };
}

export async function createPaymentLink(userId: string, body: any) {
  const link: any = { id: `pl-${uuidv4().slice(0, 8)}`, userId, amount: body.amount, currency: body.currency || "USD", description: body.description || "Payment", url: `https://flow.ma/pay/${uuidv4().slice(0, 12)}`, status: "active", createdAt: new Date().toISOString() };
  await auditLog(userId, "PAYMENT_LINK_CREATED", "FREELANCER", `Payment link for ${body.amount} ${body.currency || "USD"}`);
  return link;
}
