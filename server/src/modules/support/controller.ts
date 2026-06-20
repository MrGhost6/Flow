import { Request, Response } from "express";
import * as service from "./service";
import { sendSuccess } from "../../common/utils/response";

export async function createTicket(req: Request, res: Response) {
  const ticket = await service.createTicket(req.userId!, req.body);
  return res.status(201).json({ ticket });
}

export async function listTickets(req: Request, res: Response) {
  const items = await service.listTickets(req.userId!);
  return res.json(items);
}

export async function getTicket(req: Request, res: Response) {
  const ticket = await service.getTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  return res.json(ticket);
}

export async function addMessage(req: Request, res: Response) {
  const msg = await service.addMessage(req.userId!, req.params.id, req.body);
  return res.status(201).json(msg);
}

export async function closeTicket(req: Request, res: Response) {
  await service.closeTicket(req.userId!, req.params.id);
  return sendSuccess(res, { message: "Ticket closed" });
}
