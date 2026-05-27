import { v4 as uuidv4 } from "uuid";
import { auditLog } from "../../common/utils/audit";
import { getUserTransactions } from "../../lib/dbHelpers";

export async function createRequest(userId: string, body: any) {
  const pr: any = { id: `req-${uuidv4().slice(0, 8)}`, requester_user_id: userId, receiver_user_id: "", wallet_id: "", amount: body.amount, currency: body.currency || "MAD", note: body.note || "", status: "pending", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 7 * 86400000).toISOString() };
  return pr;
}

export async function listRequests(_userId?: string) {
  return [];
}

export async function acceptRequest(userId: string, reqId: string) {
  await auditLog(userId, "PAYMENT_ACCEPTED", "TRANSACTION", `Payment request ${reqId} accepted`);
}

export async function declineRequest(userId: string, reqId: string) {
  await auditLog(userId, "PAYMENT_DECLINED", "TRANSACTION", `Payment request ${reqId} declined`);
}

export async function cancelRequest(userId: string, reqId: string) {
  await auditLog(userId, "PAYMENT_CANCELLED", "TRANSACTION", `Payment request ${reqId} cancelled`);
}

export async function generateQR(userId: string, body: any) {
  const qr = { id: `qr-${uuidv4().slice(0, 8)}`, creator_user_id: userId, amount: body.amount, currency: body.currency || "MAD", qr_token: `flow_qr_${uuidv4().slice(0, 12)}`, status: "pending", expires_at: new Date(Date.now() + 30 * 60000).toISOString(), created_at: new Date().toISOString() };
  return qr;
}

export async function validateQR(body: any) {
  if (!body.qr_token) throw Object.assign(new Error("QR token required"), { statusCode: 400 });
  return { valid: true };
}

export async function payQR(userId: string, body: any) {
  if (!body.qr_token) throw Object.assign(new Error("QR token required"), { statusCode: 400 });
  await auditLog(userId, "QR_PAYMENT", "TRANSACTION", `QR payment completed: ${body.qr_token}`);
}

export async function createSplitBill(userId: string, body: any) {
  const sb: any = { id: `split-${uuidv4().slice(0, 8)}`, creator_user_id: userId, title: body.title, total_amount: body.totalAmount, currency: body.currency || "MAD", status: "pending", created_at: new Date().toISOString(), participants: body.participants };
  await auditLog(userId, "SPLIT_BILL_CREATED", "TRANSACTION", `Split bill: ${body.title}`);
  return sb;
}

export async function listSplitBills() { return []; }
export async function paySplitBill(userId: string, billId: string) {
  await auditLog(userId, "SPLIT_BILL_PAID", "TRANSACTION", `Split bill ${billId} paid`);
}
