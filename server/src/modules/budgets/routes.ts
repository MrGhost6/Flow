import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import * as ctrl from "./controller";

const router = Router();

router.get("/", asyncHandler(ctrl.list));
router.post("/", asyncHandler(ctrl.create));
router.delete("/:id", asyncHandler(ctrl.remove));

export default router;
