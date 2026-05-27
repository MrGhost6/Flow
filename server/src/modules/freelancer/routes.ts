import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import * as ctrl from "./controller";

const router = Router();

router.get("/clients", asyncHandler(ctrl.clients));
router.post("/clients", asyncHandler(ctrl.addClient));
router.get("/invoices", asyncHandler(ctrl.invoices));
router.post("/invoices", asyncHandler(ctrl.createInvoice));
router.get("/earnings", asyncHandler(ctrl.earnings));
router.post("/tax-estimate", asyncHandler(ctrl.estimateTax));
router.post("/payment-links", asyncHandler(ctrl.createPaymentLink));

export default router;
