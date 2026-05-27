import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import * as ctrl from "./controller";

const router = Router();

router.get("/overview", asyncHandler(ctrl.overview));
router.get("/spending", asyncHandler(ctrl.spending));
router.get("/cashflow", asyncHandler(ctrl.cashflow));
router.get("/trends", asyncHandler(ctrl.trends));
router.get("/categories", asyncHandler(ctrl.categories));
router.get("/monthly-report", asyncHandler(ctrl.monthlyReport));

export default router;
