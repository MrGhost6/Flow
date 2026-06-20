import { z } from "zod";

export const currencyEnum = z.enum(["USD", "EUR", "MAD"]);
export const userTypeEnum = z.enum(["INDIVIDUAL", "BUSINESS"]);

export const registerSchema = z.object({ name: z.string().min(1).max(100), email: z.string().email(), phone: z.string().optional(), password: z.string().min(8).max(128), userType: userTypeEnum.optional(), primaryCurrency: currencyEnum.optional(), country: z.string().optional() });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1), deviceName: z.string().optional(), deviceFingerprint: z.string().optional() });
export const otpSchema = z.object({ verificationToken: z.string().min(1), otpCode: z.string().length(6) });
export const resendOtpSchema = z.object({ verificationToken: z.string().min(1) });
export const forgotPasswordSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema = z.object({ verificationToken: z.string().min(1), otpCode: z.string().length(6), newPassword: z.string().min(8).max(128) });
export const refreshTokenSchema = z.object({ refreshToken: z.string().min(1) });
export const transferSchema = z.object({ senderWalletId: z.string().optional(), receiverIdentifier: z.string().min(1), amount: z.number().positive(), currency: currencyEnum.optional(), description: z.string().optional(), category: z.string().optional(), recipient: z.string().optional() });
export const exchangeSchema = z.object({ fromCurrency: currencyEnum, toCurrency: currencyEnum, amount: z.number().positive() });
export const paymentRequestSchema = z.object({ receiverIdentifier: z.string().min(1), amount: z.number().positive(), currency: currencyEnum.optional(), note: z.string().optional() });
export const splitBillSchema = z.object({ title: z.string().min(1), totalAmount: z.number().positive(), currency: currencyEnum.optional(), participants: z.array(z.object({ userId: z.string(), amount: z.number().positive() })).min(1) });
export const virtualCardSchema = z.object({ currency: currencyEnum.optional(), cardholderName: z.string().min(1).optional() });
export const physicalCardSchema = z.object({ deliveryAddress: z.string().min(10), currency: currencyEnum.optional() });
export const cardLimitSchema = z.object({ dailyLimit: z.number().positive().optional(), monthlyLimit: z.number().positive().optional(), singleLimit: z.number().positive().optional() });
export const budgetSchema = z.object({ name: z.string().min(1), amount: z.number().positive(), category: z.string().optional(), period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).optional() });
export const savingsGoalSchema = z.object({ title: z.string().min(1), targetAmount: z.number().positive(), currency: currencyEnum.optional(), targetDate: z.string().optional(), goalType: z.enum(["travel", "emergency_fund", "rent", "electronics", "vehicle", "education", "custom"]).optional() });
export const savingsContributeSchema = z.object({ amount: z.number().positive() });
export const kycSubmitSchema = z.object({ documentType: z.string().min(1), documentNumber: z.string().min(1) });
export const ticketSchema = z.object({ subject: z.string().min(1).max(200), description: z.string().min(1).max(5000), category: z.string().optional(), priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional() });
export const ticketMessageSchema = z.object({ message: z.string().min(1).max(10000) });
export const clientSchema = z.object({ name: z.string().min(1), email: z.string().email().optional(), phone: z.string().optional(), address: z.string().optional(), taxId: z.string().optional() });
export const invoiceSchema = z.object({ clientId: z.string().optional(), clientName: z.string().optional(), amount: z.number().positive(), description: z.string().optional(), dueDate: z.string().optional(), currency: currencyEnum.optional() });
export const businessSchema = z.object({ name: z.string().min(1), legalName: z.string().optional(), email: z.string().email().optional(), industry: z.string().optional(), taxId: z.string().optional() });
export const businessMemberSchema = z.object({ email: z.string().email(), role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).optional() });
export const expenseSchema = z.object({ amount: z.number().positive(), category: z.string().optional(), description: z.string().optional(), currency: currencyEnum.optional() });

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { value?: T; error?: string } {
  const result = schema.safeParse(data);
  if (!result.success) return { error: result.error.errors[0].message };
  return { value: result.data };
}
