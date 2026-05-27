import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import * as ctrl from "./controller";

const router = Router();

router.get("/", asyncHandler(ctrl.list));
router.patch("/:id/read", asyncHandler(ctrl.markRead));

export default router;
