import rateLimit, { Store } from "express-rate-limit";
import { getRedis } from "../../database/redis";

class RedisRateStore implements Store {
  async increment(key: string) {
    const r = getRedis();
    if (!r) return { totalHits: 1, resetTime: undefined };
    const now = Date.now();
    const windowMs = 60000;
    const resetAt = Math.ceil((now + 1) / windowMs) * windowMs;
    const ttl = Math.ceil((resetAt - now) / 1000);
    const count = await r.incr(`rl:${key}`);
    if (count === 1) await r.pexpireat(`rl:${key}`, resetAt);
    return { totalHits: count, resetTime: new Date(resetAt) };
  }
  async decrement(key: string) {
    const r = getRedis();
    if (r) await r.decr(`rl:${key}`);
  }
  async resetKey(key: string) {
    const r = getRedis();
    if (r) await r.del(`rl:${key}`);
  }
}

const redisStore = new RedisRateStore();

const rlOpts = (max: number, windowMs = 60_000) => ({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
  message: { error: "Rate limit exceeded", code: "ERR_RATE_LIMIT" },
} as any);

export const authLimiter = rateLimit({ ...rlOpts(10, 60_000), message: { error: "Too many auth requests", code: "ERR_RATE_LIMIT" } });
export const otpLimiter = rateLimit({ ...rlOpts(5, 60_000), message: { error: "Too many OTP requests", code: "ERR_RATE_LIMIT" } });
export const transferLimiter = rateLimit({ ...rlOpts(30, 60_000), message: { error: "Too many transfers", code: "ERR_RATE_LIMIT" } });
export const cardLimiter = rateLimit({ ...rlOpts(10, 60_000), message: { error: "Too many card operations", code: "ERR_RATE_LIMIT" } });
export const passwordResetLimiter = rateLimit({ ...rlOpts(3, 300_000), message: { error: "Too many reset attempts", code: "ERR_RATE_LIMIT" } });
export const generalLimiter = rateLimit({ ...rlOpts(120, 60_000) });
