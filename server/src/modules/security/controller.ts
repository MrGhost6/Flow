import { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response";
import * as secService from "./service";

export async function overview(req: Request, res: Response) {
  const data = await secService.getOverview(req.userId!);
  return res.json(data);
}

export async function devices(req: Request, res: Response) {
  const data = await secService.getDevices(req.userId!);
  return res.json(data);
}

export async function sessions(req: Request, res: Response) {
  const data = await secService.getSessions(req.userId!);
  return res.json(data);
}

export async function loginHistory(req: Request, res: Response) {
  const data = await secService.getLoginHistory(req.userId!);
  return res.json(data);
}

export async function fraudEvents(req: Request, res: Response) {
  const data = await secService.getFraudEvents(req.userId!);
  return res.json(data);
}

export async function emergencyFreeze(req: Request, res: Response) {
  await secService.emergencyFreeze(req.userId!);
  return sendSuccess(res, { message: "All cards frozen, login attempts blocked, admins notified" });
}

export async function emergencyThaw(req: Request, res: Response) {
  await secService.emergencyThaw(req.userId!);
  return sendSuccess(res, { message: "Account unfrozen" });
}

export async function requestBiometric(req: Request, res: Response) {
  const data = await secService.requestBiometric(req.userId!);
  return res.json(data);
}

export async function enableBiometric(req: Request, res: Response) {
  await secService.enableBiometric(req.userId!);
  return sendSuccess(res, { message: "Biometric authentication enabled" });
}

export async function disableBiometric(req: Request, res: Response) {
  await secService.disableBiometric(req.userId!);
  return sendSuccess(res, { message: "Biometric authentication disabled" });
}

export async function enable2FA(req: Request, res: Response) {
  await secService.enable2FA(req.userId!);
  return sendSuccess(res, { message: "Two-factor authentication enabled" });
}

export async function disable2FA(req: Request, res: Response) {
  await secService.disable2FA(req.userId!);
  return sendSuccess(res, { message: "Two-factor authentication disabled" });
}
