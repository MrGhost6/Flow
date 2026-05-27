import { Request, Response } from "express";
import { getPrisma } from "../../database/prisma";

export async function list(req: Request, res: Response) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const data = await p.notification.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "desc" } });
  return res.json(data);
}

export async function markRead(req: Request, res: Response) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  return res.json({ message: "Notification marked as read" });
}

export async function markAllRead(req: Request, res: Response) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.notification.updateMany({ where: { userId: req.userId, isRead: false }, data: { isRead: true } });
  return res.json({ message: "All notifications marked as read" });
}
