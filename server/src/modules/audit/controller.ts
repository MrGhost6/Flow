import { Request, Response } from "express";
import { getPrisma } from "../../database/prisma";

export async function list(req: Request, res: Response) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const data = await p.auditLog.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "desc" }, take: 50 });
  return res.json(data);
}
