import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import * as ctrl from "./controller";

const router = Router();

router.get("/", asyncHandler(ctrl.getWallets));
router.get("/:id", asyncHandler(ctrl.getWallet));
router.get("/:id/transactions", asyncHandler(ctrl.getWalletTransactions));
router.get("/:id/activity", asyncHandler(ctrl.getWalletActivity));
router.post("/exchange", asyncHandler(ctrl.exchange));
router.patch("/:id/limits", asyncHandler(ctrl.updateLimits));

export default router;
