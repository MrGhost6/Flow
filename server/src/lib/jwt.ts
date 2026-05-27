import jwt from "jsonwebtoken";
import { config } from "../config";

export function generateTokens(userId: string, email: string) {
  return {
    accessToken: jwt.sign({ userId, email }, config.jwtSecret, { expiresIn: "1h" }),
    refreshToken: jwt.sign({ userId, type: "refresh" }, config.jwtRefreshSecret, { expiresIn: "7d" }),
  };
}
