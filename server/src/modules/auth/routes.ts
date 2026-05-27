import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import { authLimiter, otpLimiter, passwordResetLimiter } from "../../common/middlewares/rateLimiter";
import * as ctrl from "./controller";

const router = Router();

router.use(authLimiter);

router.post("/register", asyncHandler(ctrl.register));
router.post("/verify-otp", asyncHandler(ctrl.verifyOtp));
router.post("/resend-otp", otpLimiter, asyncHandler(ctrl.resendOtp));
router.post("/login", asyncHandler(ctrl.login));
router.post("/logout", asyncHandler(ctrl.logout));
router.post("/refresh-token", asyncHandler(ctrl.refreshToken));
router.post("/forgot-password", passwordResetLimiter, asyncHandler(ctrl.forgotPassword));
router.post("/reset-password", asyncHandler(ctrl.resetPassword));
router.get("/sessions", asyncHandler(ctrl.getSessions));
router.delete("/sessions/:id", asyncHandler(ctrl.revokeSession));

export default router;
