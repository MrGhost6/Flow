import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import * as ctrl from "./controller";

const router = Router();

router.get("/overview", asyncHandler(ctrl.overview));
router.get("/devices", asyncHandler(ctrl.devices));
router.get("/sessions", asyncHandler(ctrl.sessions));
router.get("/login-history", asyncHandler(ctrl.loginHistory));
router.get("/fraud-events", asyncHandler(ctrl.fraudEvents));
router.post("/freeze", asyncHandler(ctrl.emergencyFreeze));
router.post("/thaw", asyncHandler(ctrl.emergencyThaw));
router.post("/biometric/request", asyncHandler(ctrl.requestBiometric));
router.post("/biometric/enable", asyncHandler(ctrl.enableBiometric));
router.post("/biometric/disable", asyncHandler(ctrl.disableBiometric));
router.post("/2fa/enable", asyncHandler(ctrl.enable2FA));
router.post("/2fa/disable", asyncHandler(ctrl.disable2FA));

export default router;
