import { Router } from "express";
import { asyncHandler } from "../../common/middlewares";
import * as ctrl from "./controller";

const router = Router();

router.post("/tickets", asyncHandler(ctrl.createTicket));
router.get("/tickets", asyncHandler(ctrl.listTickets));
router.get("/tickets/:id", asyncHandler(ctrl.getTicket));
router.post("/tickets/:id/messages", asyncHandler(ctrl.addMessage));
router.patch("/tickets/:id/close", asyncHandler(ctrl.closeTicket));

export default router;
