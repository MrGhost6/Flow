import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import * as ctrl from "./controller";

const router = Router();

router.post("/request", asyncHandler(ctrl.createRequest));
router.get("/requests", asyncHandler(ctrl.listRequests));
router.get("/requests/:id", (req, res) => res.json({ id: req.params.id }));
router.patch("/requests/:id/accept", asyncHandler(ctrl.acceptRequest));
router.patch("/requests/:id/decline", asyncHandler(ctrl.declineRequest));
router.patch("/requests/:id/cancel", asyncHandler(ctrl.cancelRequest));
router.post("/qr/generate", asyncHandler(ctrl.generateQR));
router.post("/qr/validate", asyncHandler(ctrl.validateQR));
router.post("/qr/pay", asyncHandler(ctrl.payQR));
router.post("/split-bill", asyncHandler(ctrl.createSplitBill));
router.get("/split-bills", asyncHandler(ctrl.listSplitBills));
router.get("/split-bills/:id", (req, res) => res.json({ id: req.params.id }));
router.post("/split-bills/:id/pay", asyncHandler(ctrl.paySplitBill));

export default router;
