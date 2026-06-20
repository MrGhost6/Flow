import { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response";
import * as service from "./service";

export async function list(req: Request, res: Response) {
  const insights = await service.list(req.userId!);
  return res.json(insights);
}

export async function markRead(req: Request, res: Response) {
  await service.markRead(req.userId!, req.params.id);
  return sendSuccess(res, {});
}

export async function dismiss(req: Request, res: Response) {
  await service.dismiss(req.userId!, req.params.id);
  return sendSuccess(res, {});
}
