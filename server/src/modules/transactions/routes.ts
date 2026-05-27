import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import { transferLimiter } from "../../common/middlewares/rateLimiter";
import * as ctrl from "./controller";

const router = Router();

router.post("/send", transferLimiter, asyncHandler(ctrl.send));
router.post("/validate", asyncHandler(ctrl.validateTx));
router.get("/search", asyncHandler(ctrl.search));
router.get("/filter", asyncHandler(ctrl.filter));
router.get("/", asyncHandler(ctrl.list));
router.get("/:id", asyncHandler(ctrl.getById));
router.get("/:id/receipt", asyncHandler(ctrl.getReceipt));
router.patch("/:id/category", asyncHandler(ctrl.updateCategory));

export default router;
