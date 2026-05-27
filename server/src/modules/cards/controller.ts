import { Request, Response } from "express";
import { virtualCardSchema, physicalCardSchema, cardLimitSchema, validate } from "../../common/validators";
import { sendSuccess, sendError } from "../../common/utils/response";
import * as cardService from "./service";
import { getUserTransactions } from "../../lib/dbHelpers";

export async function list(req: Request, res: Response) {
  const cards = await cardService.getCards(req.userId!);
  return res.json(cards);
}

export async function createVirtual(req: Request, res: Response) {
  const { error, value } = validate(virtualCardSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  const card = await cardService.createVirtual(req.userId!, value!);
  return sendSuccess(res, { card });
}

export async function requestPhysical(req: Request, res: Response) {
  const { error, value } = validate(physicalCardSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  const card = await cardService.requestPhysical(req.userId!, value!);
  return sendSuccess(res, { card });
}

export async function freeze(req: Request, res: Response) {
  await cardService.freezeCard(req.userId!, req.params.id);
  return sendSuccess(res, { message: "Card frozen" });
}

export async function unfreeze(req: Request, res: Response) {
  await cardService.unfreezeCard(req.userId!, req.params.id);
  return sendSuccess(res, { message: "Card unfrozen" });
}

export async function block(req: Request, res: Response) {
  const { reason } = req.body;
  await cardService.blockCard(req.userId!, req.params.id, reason);
  return sendSuccess(res, { message: "Card blocked. Admin review required for re-issuance.", requiresAdminReview: true });
}

export async function updateLimits(req: Request, res: Response) {
  const { error, value } = validate(cardLimitSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  await cardService.updateLimits(req.userId!, req.params.id, value!);
  return sendSuccess(res, { message: "Card limits updated" });
}

export async function getAnalytics(req: Request, res: Response) {
  const data = await cardService.getAnalytics();
  return res.json(data);
}

export async function getTransactions(req: Request, res: Response) {
  const txs = await getUserTransactions(req.userId!);
  return res.json(txs.slice(0, 10));
}
