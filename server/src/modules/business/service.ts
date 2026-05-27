import { v4 as uuidv4 } from "uuid";
import { auditLog } from "../../common/utils/audit";

const businesses: any[] = [];

export async function register(userId: string, body: any) {
  const biz: any = { id: `biz-${uuidv4().slice(0, 8)}`, ownerUserId: userId, companyName: body.companyName, registrationNumber: `RC-${Date.now()}`, type: body.type || "LLC", email: body.email, phone: body.phone, address: body.address, status: "active", verified: false, createdAt: new Date().toISOString() };
  businesses.push(biz);
  await auditLog(userId, "BUSINESS_REGISTERED", "BUSINESS", `Registered ${body.companyName}`);
  return biz;
}

export async function getProfile() {
  return businesses[0] || { companyName: "Flow Tech SARL", registrationNumber: "RC-12345", type: "SARL", email: "contact@flow.ma", phone: "+212 6 00 00 00 00", address: "Casablanca, Morocco", status: "active", verified: true, createdAt: new Date().toISOString() };
}

export async function updateProfile(userId: string, body: any) {
  await auditLog(userId, "BUSINESS_UPDATED", "BUSINESS", "Business profile updated");
  return { ...body, updatedAt: new Date().toISOString() };
}

export async function getMembers() { return []; }

export async function addMember(userId: string, body: any) {
  const member: any = { id: `member-${uuidv4().slice(0, 8)}`, businessId: body.businessId, email: body.email, role: body.role || "member", status: "invited", invitedAt: new Date().toISOString() };
  await auditLog(userId, "MEMBER_INVITED", "BUSINESS", `Invited ${body.email} as ${member.role}`);
  return member;
}

export async function removeMember(userId: string, memberId: string) {
  await auditLog(userId, "MEMBER_REMOVED", "BUSINESS", `Removed member ${memberId}`);
}

export async function getInvoices() { return []; }

export async function createInvoice(userId: string, body: any) {
  const inv: any = { id: `biz-inv-${uuidv4().slice(0, 8)}`, userId, clientEmail: body.clientEmail, amount: body.amount, currency: body.currency || "MAD", status: "pending", dueDate: body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0], createdAt: new Date().toISOString() };
  await auditLog(userId, "BUSINESS_INVOICE_CREATED", "BUSINESS", `Invoice ${inv.id} created`);
  return inv;
}

export async function getExpenses() { return []; }

export async function addExpense(userId: string, body: any) {
  const exp: any = { id: `exp-${uuidv4().slice(0, 8)}`, userId, category: body.category || "Other", amount: body.amount, currency: body.currency || "MAD", description: body.description || "", date: body.date || new Date().toISOString().split("T")[0], createdAt: new Date().toISOString() };
  await auditLog(userId, "EXPENSE_ADDED", "BUSINESS", `Expense ${exp.id}: ${exp.amount} ${exp.currency}`);
  return exp;
}

export async function runPayroll(userId: string, body: any) {
  await auditLog(userId, "PAYROLL_RUN", "BUSINESS", `Payroll run for ${body.period || "current month"}`);
  return { message: `Payroll processed for ${body.employees?.length || 0} employees`, total: body.totalAmount || 0, currency: body.currency || "MAD", processedAt: new Date().toISOString() };
}
