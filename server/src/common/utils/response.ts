import { Response } from "express";

export function sendSuccess(res: Response, data: any = {}, status = 200) {
  return res.status(status).json({ ...data, status: "success" });
}

export function sendError(res: Response, message: string, status = 400, code?: string) {
  return res.status(status).json({ error: message, code: code || `ERR_${status}` });
}
