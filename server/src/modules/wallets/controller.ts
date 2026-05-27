import { Request, Response } from "express";
import { exchangeSchema, validate } from "../../common/validators";
import { sendSuccess, sendError } from "../../common/utils/response";
import * as walletService from "./service";

export async function getWallets(req: Request, res: Response) {
  const wallets = await walletService.getWallets(req.userId!);
  return res.json(wallets);
}

export async function getWallet(req: Request, res: Response) {
  try {
    const wallet = await walletService.getWallet(req.userId!, req.params.id);
    return res.json(wallet);
  } catch (e: any) { return sendError(res, e.message, e.statusCode || 404); }
}

export async function getWalletTransactions(req: Request, res: Response) {
  const txs = await walletService.getWalletTransactions(req.userId!, req.params.id);
  return res.json(txs);
}

export async function getWalletActivity(req: Request, res: Response) {
  const { getUserTransactions } = await import("../../lib/dbHelpers");
  const txs = await getUserTransactions(req.userId!);
  return res.json(txs.slice(0, 50));
}

export async function exchange(req: Request, res: Response) {
  const { error, value } = validate(exchangeSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  try {
    const result = await walletService.exchangeCurrency(req.userId!, value!);
    return sendSuccess(res, result);
  } catch (e: any) { return sendError(res, e.message, e.statusCode || 400); }
}

export async function updateLimits(req: Request, res: Response) {
  try {
    const result = await walletService.updateWalletLimits(req.userId!, req.params.id, req.body);
    return res.json(result);
  } catch { return sendError(res, "Failed to update limits"); }
}
