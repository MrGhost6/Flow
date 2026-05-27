import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";
import { sendError } from "../utils/response";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("[ERROR]", err.message);
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.code);
  }
  return sendError(res, "Internal server error", 500, "ERR_INTERNAL");
}
