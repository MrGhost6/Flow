import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import * as ctrl from "./controller";

const router = Router();

router.get("/", asyncHandler(ctrl.list));
router.get("/:id", asyncHandler(ctrl.get));
router.patch("/:id", asyncHandler(ctrl.update));

export default router;
