import { Request, Response } from "express";
import { savingsGoalSchema, savingsContributeSchema, validate } from "../../common/validators";
import { sendSuccess, sendError } from "../../common/utils/response";
import * as service from "./service";

export async function listGoals(req: Request, res: Response) {
  const goals = await service.listGoals(req.userId!);
  return res.json(goals);
}

export async function createGoal(req: Request, res: Response) {
  const { error, value } = validate(savingsGoalSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  const goal = await service.createGoal(req.userId!, value!);
  return sendSuccess(res, { goal });
}

export async function getGoal(req: Request, res: Response) {
  const goal = await service.getGoal(req.userId!, req.params.id);
  if (!goal) return sendError(res, "Goal not found", 404, "ERR_NOT_FOUND");
  return res.json(goal);
}

export async function updateGoal(req: Request, res: Response) {
  const goal = await service.updateGoal(req.userId!, req.params.id, req.body);
  return sendSuccess(res, { goal });
}

export async function contribute(req: Request, res: Response) {
  const { error, value } = validate(savingsContributeSchema, req.body);
  if (error) return sendError(res, error, 400, "ERR_VALIDATION");
  const goal = await service.contribute(req.userId!, req.params.id, value!.amount);
  return sendSuccess(res, { goal });
}
