import { Request, Response } from "express";
import { paymentRequestSchema, splitBillSchema, validate } from "../../common/validators";
import { sendSuccess, sendError } from "../../common/utils/response";
import * as pmtService from "./service";

export async function createRequest(req: Request, res: Response) {
  const { error, value } = validate(paymentRequestSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  const pr = await pmtService.createRequest(req.userId!, value!);
  return sendSuccess(res, { paymentRequest: pr });
}

export async function listRequests(req: Request, res: Response) {
  const items = await pmtService.listRequests(req.userId!);
  return res.json(items);
}

export async function acceptRequest(req: Request, res: Response) {
  await pmtService.acceptRequest(req.userId!, req.params.id);
  return sendSuccess(res, { message: "Payment request accepted" });
}

export async function declineRequest(req: Request, res: Response) {
  await pmtService.declineRequest(req.userId!, req.params.id);
  return sendSuccess(res, { message: "Payment request declined" });
}

export async function cancelRequest(req: Request, res: Response) {
  await pmtService.cancelRequest(req.userId!, req.params.id);
  return sendSuccess(res, { message: "Payment request cancelled" });
}

export async function generateQR(req: Request, res: Response) {
  const qr = await pmtService.generateQR(req.userId!, req.body);
  return sendSuccess(res, { qrPayment: qr });
}

export async function validateQR(req: Request, res: Response) {
  try {
    const result = await pmtService.validateQR(req.body);
    return sendSuccess(res, result);
  } catch (e: any) { return sendError(res, e.message, 400); }
}

export async function payQR(req: Request, res: Response) {
  try {
    await pmtService.payQR(req.userId!, req.body);
    return sendSuccess(res, { message: "QR payment completed" });
  } catch (e: any) { return sendError(res, e.message, 400); }
}

export async function createSplitBill(req: Request, res: Response) {
  const { error, value } = validate(splitBillSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  const sb = await pmtService.createSplitBill(req.userId!, value!);
  return sendSuccess(res, { splitBill: sb });
}

export async function listSplitBills(req: Request, res: Response) {
  const items = await pmtService.listSplitBills();
  return res.json(items);
}

export async function paySplitBill(req: Request, res: Response) {
  await pmtService.paySplitBill(req.userId!, req.params.id);
  return sendSuccess(res, { message: "Split bill contribution paid" });
}
