import Redis from "ioredis";
import { config } from "../config";

let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (_redis) return _redis;
  try {
    _redis = new Redis(config.redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: false });
    console.log("[REDIS] Connected");
    return _redis;
  } catch {
    console.warn("[REDIS] Unavailable — OTP/rate-limit/sessions degraded");
    return null;
  }
}

export const redis = _redis;

export function initRedis(): Redis | null {
  return getRedis();
}

export async function redisGet(key: string): Promise<string | null> {
  const r = getRedis();
  if (!r) throw new Error("Redis unavailable");
  return r.get(key);
}

export async function redisSet(key: string, value: string, ttlSec?: number): Promise<void> {
  const r = getRedis();
  if (!r) throw new Error("Redis unavailable");
  if (ttlSec) await r.setex(key, ttlSec, value);
  else await r.set(key, value);
}

export async function redisDel(key: string): Promise<void> {
  const r = getRedis();
  if (!r) throw new Error("Redis unavailable");
  await r.del(key);
}
