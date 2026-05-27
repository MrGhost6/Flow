import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../common/utils/response";
import * as service from "./service";

export async function list(req: Request, res: Response) {
  const subs = await service.list(req.userId!);
  return res.json(subs);
}

export async function get(req: Request, res: Response) {
  const sub = await service.get(req.userId!, req.params.id);
  if (!sub) return sendError(res, "Subscription not found", 404, "ERR_NOT_FOUND");
  return res.json(sub);
}

export async function update(req: Request, res: Response) {
  const sub = await service.update(req.userId!, req.params.id, req.body);
  return sendSuccess(res, { subscription: sub });
}
