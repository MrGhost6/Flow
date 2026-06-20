import { Request, Response } from "express";
import { transferSchema, validate } from "../../common/validators";
import { sendSuccess, sendError } from "../../common/utils/response";
import * as txService from "./service";
import { getUserTransactions } from "../../lib/dbHelpers";
import { transferLimiter } from "../../common/middlewares/rateLimiter";

export async function send(req: Request, res: Response) {
  const { error, value } = validate(transferSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  try {
    const result = await txService.sendTransfer(req.userId!, value!);
    return sendSuccess(res, result);
  } catch (e: any) { return sendError(res, e.message, e.statusCode || 400, e.code); }
}

export async function validateTx(req: Request, res: Response) {
  const result = await txService.validateTransfer(req.userId!, req.body);
  return res.json(result);
}

export async function list(req: Request, res: Response) {
  const txs = await txService.getHistory(req.userId!);
  return res.json(txs);
}

export async function search(req: Request, res: Response) {
  const q = (req.query.q as string) || "";
  const txs = await txService.search(req.userId!, q);
  return res.json(txs);
}

export async function filter(req: Request, res: Response) {
  const txs = await txService.filter(req.userId!, req.query);
  return res.json(txs);
}

export async function getById(req: Request, res: Response) {
  try {
    const tx = await txService.getById(req.params.id, req.userId!);
    return res.json(tx);
  } catch (e: any) { return sendError(res, e.message, 404); }
}

export async function getReceipt(req: Request, res: Response) {
  try {
    const receipt = await txService.getReceipt(req.params.id, req.userId!);
    return res.json(receipt);
  } catch (e: any) { return sendError(res, e.message, 404); }
}

export async function updateCategory(req: Request, res: Response) {
  const result = await txService.updateCategory(req.params.id, req.body.category);
  return res.json(result);
}
