import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import * as ctrl from "./service";

const router = Router();

router.post("/login", asyncHandler(ctrl.login));
router.get("/dashboard", asyncHandler(ctrl.dashboard));
router.get("/users", asyncHandler(ctrl.users));
router.patch("/users/:id", asyncHandler(ctrl.updateUser));
router.get("/kyc", asyncHandler(ctrl.getKYCDetails));
router.post("/kyc/review", asyncHandler(ctrl.reviewKYC));
router.get("/fraud", asyncHandler(ctrl.getFraudList));
router.get("/support", asyncHandler(ctrl.getSupportTickets));
router.get("/audit-log", asyncHandler(ctrl.getAuditLog));
router.get("/analytics", asyncHandler(ctrl.getAdminAnalytics));

export default router;
