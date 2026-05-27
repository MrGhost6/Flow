import { PrismaClient } from "@prisma/client";

let _prisma: PrismaClient | null = null;

export async function initPrisma(): Promise<PrismaClient | null> {
  if (_prisma) return _prisma;
  try {
    _prisma = new PrismaClient();
    await _prisma.$connect();
    console.log("[DB] PostgreSQL connected via Prisma");
    return _prisma;
  } catch (err: any) {
    console.warn("[DB] PostgreSQL unavailable — dev-fallback mode:", err.message);
    return null;
  }
}

export function getPrisma(): PrismaClient | null {
  return _prisma;
}
