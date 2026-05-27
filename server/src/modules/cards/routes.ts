import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import { cardLimiter } from "../../common/middlewares/rateLimiter";
import * as ctrl from "./controller";

const router = Router();

router.get("/", asyncHandler(ctrl.list));
router.post("/virtual", cardLimiter, asyncHandler(ctrl.createVirtual));
router.post("/physical-request", cardLimiter, asyncHandler(ctrl.requestPhysical));
router.patch("/:id/freeze", asyncHandler(ctrl.freeze));
router.patch("/:id/unfreeze", asyncHandler(ctrl.unfreeze));
router.post("/:id/block", cardLimiter, asyncHandler(ctrl.block));
router.patch("/:id/limits", cardLimiter, asyncHandler(ctrl.updateLimits));
router.get("/:id/analytics", asyncHandler(ctrl.getAnalytics));
router.get("/:id/transactions", asyncHandler(ctrl.getTransactions));

export default router;
