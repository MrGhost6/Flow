import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import * as ctrl from "./controller";

const router = Router();

router.get("/goals", asyncHandler(ctrl.listGoals));
router.post("/goals", asyncHandler(ctrl.createGoal));
router.get("/goals/:id", asyncHandler(ctrl.getGoal));
router.patch("/goals/:id", asyncHandler(ctrl.updateGoal));
router.post("/goals/:id/contribute", asyncHandler(ctrl.contribute));

export default router;
