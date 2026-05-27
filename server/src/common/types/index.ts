import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface ApiResponse<T = any> {
  status: string;
  data?: T;
  error?: string;
  code?: string;
  [key: string]: any;
}

export type Controller = (req: Request, res: Response, next?: NextFunction) => Promise<any> | any;
