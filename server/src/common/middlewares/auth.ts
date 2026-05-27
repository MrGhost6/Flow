import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config";
import { sendError } from "../utils/response";
import { TokenPayload } from "../types";

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const decoded = jwt.verify(header.split(" ")[1], config.jwtSecret) as TokenPayload;
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
  } catch {
    return sendError(res, "Token expired or invalid", 401, "ERR_TOKEN_EXPIRED");
  }
  next();
}
