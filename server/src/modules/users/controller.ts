import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../common/utils/response";
import * as userService from "./service";

export async function getMe(req: Request, res: Response) {
  try {
    const user = await userService.getProfile(req.userId!);
    return sendSuccess(res, { user });
  } catch (e: any) { return sendError(res, e.message, e.statusCode || 404); }
}

export async function updateMe(req: Request, res: Response) {
  try {
    const user = await userService.updateProfile(req.userId!, req.body);
    return sendSuccess(res, { user });
  } catch (e: any) { return sendError(res, e.message, e.statusCode || 404); }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const user = await userService.updateSettings(req.userId!, req.body);
    return sendSuccess(res, { user });
  } catch (e: any) { return sendError(res, e.message, e.statusCode || 404); }
}
