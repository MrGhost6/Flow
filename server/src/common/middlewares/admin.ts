import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) return sendError(res, "Authentication required", 401, "ERR_UNAUTHORIZED");
  const role = (req as any).userRole;
  if (role !== "admin" && role !== "SUPER_ADMIN") return sendError(res, "Admin access required", 403, "ERR_FORBIDDEN");
  next();
}
