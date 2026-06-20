import { Request, Response } from "express";
import { budgetSchema, validate } from "../../common/validators";
import { sendSuccess, sendError } from "../../common/utils/response";
import * as service from "./service";

export async function list(req: Request, res: Response) {
  const budgets = await service.list(req.userId!);
  return res.json(budgets);
}

export async function create(req: Request, res: Response) {
  const { error, value } = validate(budgetSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  const budget = await service.create(req.userId!, value!);
  return sendSuccess(res, { budget });
}

export async function update(req: Request, res: Response) {
  const budget = await service.update(req.userId!, req.params.id, req.body);
  return sendSuccess(res, { budget });
}

export async function remove(req: Request, res: Response) {
  await service.remove(req.userId!, req.params.id);
  return sendSuccess(res, { message: "Budget deleted" });
}
