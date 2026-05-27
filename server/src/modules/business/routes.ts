import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import * as ctrl from "./controller";

const router = Router();

router.post("/register", asyncHandler(ctrl.register));
router.get("/profile", asyncHandler(ctrl.profile));
router.patch("/profile", asyncHandler(ctrl.updateProfile));
router.get("/members", asyncHandler(ctrl.members));
router.post("/members", asyncHandler(ctrl.addMember));
router.delete("/members/:id", asyncHandler(ctrl.removeMember));
router.get("/invoices", asyncHandler(ctrl.invoices));
router.post("/invoices", asyncHandler(ctrl.createInvoice));
router.get("/expenses", asyncHandler(ctrl.expenses));
router.post("/expenses", asyncHandler(ctrl.addExpense));
router.post("/payroll", asyncHandler(ctrl.payroll));

export default router;
