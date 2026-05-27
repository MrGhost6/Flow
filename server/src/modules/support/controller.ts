import { Controller } from "../../common/types";

export const createTicket: Controller = async (req, res) => {
  const ticket = await (await import("./service")).createTicket(req.userId!, req.body);
  return res.status(201).json({ ticket });
};

export const listTickets: Controller = async (req, res) => {
  const items = await (await import("./service")).listTickets(req.userId!);
  return res.json(items);
};

export const getTicket: Controller = async (req, res) => {
  const ticket = await (await import("./service")).getTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  return res.json(ticket);
};

export const addMessage: Controller = async (req, res) => {
  try {
    const msg = await (await import("./service")).addMessage(req.userId!, req.params.id, req.body);
    return res.status(201).json(msg);
  } catch (e: any) { return res.status(404).json({ error: e.message }); }
};

export const closeTicket: Controller = async (req, res) => {
  await (await import("./service")).closeTicket(req.userId!, req.params.id);
  return res.json({ message: "Ticket closed" });
};
