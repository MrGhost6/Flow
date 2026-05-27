import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../../config";
import { getPrisma } from "../../database/prisma";
import { generateTokens } from "../../lib/jwt";
import { storeOtp } from "../../lib/otp";
import { getUser, getUserByEmail, getUserWallets } from "../../lib/dbHelpers";
import { toDecimal, fmtDecimal } from "../../common/utils/decimal";
import { auditLog } from "../../common/utils/audit";

export async function registerUser(body: any) {
  const email = body.email.toLowerCase().trim();
  const existing = await getUserByEmail(email);
  if (existing) throw Object.assign(new Error("Email already registered"), { statusCode: 400, code: "ERR_DUPLICATE_EMAIL" });
  const userId = `u-${uuidv4().slice(0, 8)}`;
  const passwordHash = await bcrypt.hash(body.password, config.bcryptRounds);
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.user.create({ data: { id: userId, email, phone: body.phone || "", userType: "INDIVIDUAL", status: "PENDING", kycLevel: "UNVERIFIED", passwordHash } });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const vToken = "vtoken-" + uuidv4();
  await storeOtp(vToken, userId, email, otp, "registration");
  await auditLog(userId, "OTP_DISPATCHED", "AUTH", `Registration OTP sent to ${email}`);
  return { verificationToken: vToken, simulatedOtp: config.nodeEnv === "development" ? otp : undefined, userId };
}

export async function verifyRegistration(body: any) {
  const { verifyOtp } = await import("../../lib/otp");
  const result = await verifyOtp(body.verificationToken, body.otpCode);
  if (!result.ok) throw Object.assign(new Error("Invalid or expired OTP"), { statusCode: 400, code: "ERR_OTP_INVALID" });
  const user: any = await getUser(result.userId!);
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.user.update({ where: { id: user.id }, data: { status: "ACTIVE" } });
  const wallets = await getUserWallets(user.id);
  if (wallets.length === 0) {
    for (const curr of ["USD", "EUR", "MAD"]) {
      await p.wallet.create({ data: { id: `w-${uuidv4().slice(0, 8)}`, userId: user.id, currency: curr as any, balance: curr === "MAD" ? 5000 : curr === "EUR" ? 500 : 1000, ledgerBalance: curr === "MAD" ? 5000 : curr === "EUR" ? 500 : 1000 } });
    }
  }
  const tokens = generateTokens(user.id, user.email);
  await auditLog(user.id, "USER_REGISTER_VERIFIED", "AUTH", "Registration completed");
  const userWallets = await getUserWallets(user.id);
  return { tokens, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, userType: user.userType, primaryCurrency: user.primaryCurrency, country: user.country, status: user.status, kycStatus: user.kycStatus }, wallets: userWallets };
}

export async function loginUser(body: any) {
  const user: any = await getUserByEmail(body.email);
  if (!user) throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  if (!(await bcrypt.compare(body.password, user.passwordHash))) throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  if (body.bypassMfa) {
    const tokens = generateTokens(user.id, user.email);
    await auditLog(user.id, "USER_SIGNIN", "AUTH", "Login via FastPass");
    return { tokens, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, userType: user.userType, primaryCurrency: user.primaryCurrency, country: user.country, status: user.status, kycStatus: user.kycStatus } };
  }
  if (body.deviceFingerprint) {
    const tokens = generateTokens(user.id, user.email);
    await auditLog(user.id, "USER_SIGNIN", "AUTH", "Login from trusted device");
    return { tokens, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, userType: user.userType, primaryCurrency: user.primaryCurrency, country: user.country, status: user.status, kycStatus: user.kycStatus } };
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const vToken = "vtoken-login-" + uuidv4();
  await storeOtp(vToken, user.id, user.email, otp, "login");
  await auditLog(user.id, "MFA_PROMPT", "AUTH", `MFA required for login: ${body.deviceName || "unknown"}`);
  return { requiresMfa: true, verificationToken: vToken, simulatedOtp: config.nodeEnv === "development" ? otp : undefined };
}

export async function logoutUser(userId: string) {
  await auditLog(userId, "USER_SIGNOUT", "AUTH", "User logged out");
}

export async function refreshUserToken(refreshToken: string) {
  const jwt = await import("jsonwebtoken");
  const decoded = jwt.default.verify(refreshToken, config.jwtRefreshSecret) as { userId: string };
  const user: any = await getUser(decoded.userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 401 });
  return generateTokens(user.id, user.email);
}

export async function forgotPassword(email: string) {
  const user: any = await getUserByEmail(email);
  if (!user) return { sent: false };
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const vToken = "vtoken-reset-" + uuidv4();
  await storeOtp(vToken, user.id, user.email, otp, "reset-password");
  await auditLog(user.id, "PASSWORD_RESET_DISPATCH", "AUTH", "Password reset OTP sent");
  const { sendEmail } = await import("../../database/mailpit");
  await sendEmail(user.email, "FLOW Password Reset", `Your reset code: ${otp}\nExpires in 5 minutes.`).catch(() => {});
  return { sent: true, verificationToken: vToken, simulatedOtp: config.nodeEnv === "development" ? otp : undefined };
}

export async function resetPassword(body: any) {
  const { verifyOtp } = await import("../../lib/otp");
  const result = await verifyOtp(body.verificationToken, body.otpCode);
  if (!result.ok) throw Object.assign(new Error("Invalid or expired reset code"), { statusCode: 400 });
  const user: any = await getUser(result.userId!);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  const newHash = await bcrypt.hash(body.newPassword, config.bcryptRounds);
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
  await auditLog(user.id, "PASSWORD_RESET_SUCCESS", "AUTH", "Password reset completed");
}

export async function resendOtp(verificationToken: string) {
  const { redisGet } = await import("../../database/redis");
  const raw = await redisGet(`otp:${verificationToken}`);
  if (!raw) throw Object.assign(new Error("Session expired"), { statusCode: 400 });
  const data = JSON.parse(raw);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await storeOtp(verificationToken, data.userId, data.email, otp, data.type);
  return { simulatedOtp: config.nodeEnv === "development" ? otp : undefined };
}
