import bcrypt from "bcryptjs";
import { redisGet, redisSet, redisDel } from "../database/redis";

export async function storeOtp(token: string, userId: string, email: string, otpCode: string, type: string) {
  const hash = await bcrypt.hash(otpCode, 6);
  const payload = JSON.stringify({ hash, userId, email, attempts: 0, type, expiresAt: Date.now() + 300_000 });
  await redisSet(`otp:${token}`, payload, 300);
}

export async function verifyOtp(token: string, code: string): Promise<{ ok: boolean; userId?: string; email?: string }> {
  const raw = await redisGet(`otp:${token}`);
  if (!raw) return { ok: false };
  const data = JSON.parse(raw);
  if (Date.now() > data.expiresAt) {
    await redisDel(`otp:${token}`);
    return { ok: false };
  }
  if (data.attempts >= 3) {
    await redisDel(`otp:${token}`);
    return { ok: false };
  }
  const match = await bcrypt.compare(code, data.hash);
  if (!match) {
    data.attempts++;
    await redisSet(`otp:${token}`, JSON.stringify(data), 300);
    return { ok: false };
  }
  await redisDel(`otp:${token}`);
  return { ok: true, userId: data.userId, email: data.email };
}
