import rateLimit from "express-rate-limit";
import { getRedis } from "../../database/redis";

class RedisRateStore {
  private _prefix: string;
  constructor(prefix: string) { this._prefix = prefix; }
  async increment(key: string) {
    const r = getRedis();
    if (!r) return { totalHits: 1, resetTime: undefined };
    const now = Date.now();
    const resetAt = Math.ceil((now + 1) / 60000) * 60000;
    const ttl = Math.ceil((resetAt - now) / 1000);
    const count = await r.incr(`rl:${this._prefix}:${key}`);
    if (count === 1) await r.pexpireat(`rl:${this._prefix}:${key}`, resetAt);
    return { totalHits: count, resetTime: new Date(resetAt) };
  }
  async decrement(key: string) {
    const r = getRedis();
    if (r) await r.decr(`rl:${this._prefix}:${key}`);
  }
  async resetKey(key: string) {
    const r = getRedis();
    if (r) await r.del(`rl:${this._prefix}:${key}`);
  }
}

const makeStore = (prefix: string) => new RedisRateStore(prefix);

export const authLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false, store: makeStore("auth"), message: { error: "Too many auth requests", code: "ERR_RATE_LIMIT" } } as any);
export const otpLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false, store: makeStore("otp"), message: { error: "Too many OTP requests", code: "ERR_RATE_LIMIT" } } as any);
export const transferLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false, store: makeStore("transfer"), message: { error: "Too many transfers", code: "ERR_RATE_LIMIT" } } as any);
export const cardLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false, store: makeStore("card"), message: { error: "Too many card operations", code: "ERR_RATE_LIMIT" } } as any);
export const passwordResetLimiter = rateLimit({ windowMs: 300_000, max: 3, standardHeaders: true, legacyHeaders: false, store: makeStore("password-reset"), message: { error: "Too many reset attempts", code: "ERR_RATE_LIMIT" } } as any);
export const generalLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false, store: makeStore("general"), message: { error: "Rate limit exceeded", code: "ERR_RATE_LIMIT" } } as any);
