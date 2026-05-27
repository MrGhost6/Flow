import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import * as ctrl from "./controller";

const router = Router();

router.get("/me", asyncHandler(ctrl.getMe));
router.patch("/me", asyncHandler(ctrl.updateMe));
router.patch("/settings", asyncHandler(ctrl.updateSettings));

export default router;
