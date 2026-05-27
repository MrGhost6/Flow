import { Request, Response } from "express";
import { registerSchema, loginSchema, otpSchema, resendOtpSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema, validate } from "../../common/validators";
import { sendSuccess, sendError } from "../../common/utils/response";
import * as authService from "./service";
import { getPrisma } from "../../database/prisma";

import { v4 as uuidv4 } from "uuid";
import { auditLog } from "../../common/utils/audit";
import { otpRequestsTotal } from "../../database/prometheus";

export async function register(req: Request, res: Response) {
  const { error, value } = validate(registerSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  try {
    const result = await authService.registerUser(value!);
    otpRequestsTotal.inc({ type: "register" });
    return sendSuccess(res, { message: "Verify OTP to complete registration", ...result });
  } catch (e: any) {
    return sendError(res, e.message, e.statusCode || 500, e.code);
  }
}

export async function verifyOtp(req: Request, res: Response) {
  const { error, value } = validate(otpSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  try {
    const result = await authService.verifyRegistration(value!);
    return sendSuccess(res, { ...result.tokens, user: result.user, wallets: result.wallets });
  } catch (e: any) {
    return sendError(res, e.message, e.statusCode || 400, e.code);
  }
}

export async function resendOtp(req: Request, res: Response) {
  const { error, value } = validate(resendOtpSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  try {
    const result = await authService.resendOtp(value!.verificationToken);
    otpRequestsTotal.inc({ type: "resend" });
    return sendSuccess(res, { message: "New OTP sent", ...result });
  } catch (e: any) {
    return sendError(res, e.message, e.statusCode || 400);
  }
}

export async function login(req: Request, res: Response) {
  const { error, value } = validate(loginSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  try {
    const result = await authService.loginUser(value!);
    if ((result as any).requiresMfa) {
      return res.json({ status: "success", ...result });
    }
    return sendSuccess(res, { ...(result as any).tokens, user: (result as any).user });
  } catch (e: any) {
    return sendError(res, e.message, e.statusCode || 401);
  }
}

export async function logout(req: Request, res: Response) {
  await authService.logoutUser(req.userId || "unknown");
  return sendSuccess(res, { message: "Logged out" });
}

export async function refreshToken(req: Request, res: Response) {
  const { error, value } = validate(refreshTokenSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  try {
    const tokens = await authService.refreshUserToken(value!.refreshToken);
    return sendSuccess(res, { ...tokens });
  } catch {
    return sendError(res, "Invalid refresh token", 401);
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { error, value } = validate(forgotPasswordSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  const result = await authService.forgotPassword(value!.email);
  return sendSuccess(res, { message: "If account exists, reset code sent", verificationToken: result.verificationToken, simulatedOtp: result.simulatedOtp });
}

export async function resetPassword(req: Request, res: Response) {
  const { error, value } = validate(resetPasswordSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  try {
    await authService.resetPassword(value!);
    return sendSuccess(res, { message: "Password updated. Please sign in." });
  } catch (e: any) {
    return sendError(res, e.message, e.statusCode || 400);
  }
}

export async function getSessions(req: Request, res: Response) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const s = await p.session.findMany({ where: { userId: req.userId, isActive: true } });
  return res.json(s);
}

export async function revokeSession(req: Request, res: Response) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.session.update({ where: { id: req.params.id }, data: { isActive: false } });
  await auditLog(req.userId, "SESSION_REVOKED", "SECURITY", `Session ${req.params.id} revoked`);
  return sendSuccess(res, { deleted: req.params.id });
}
