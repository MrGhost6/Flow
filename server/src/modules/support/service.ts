import { v4 as uuidv4 } from "uuid";
import { getPrisma } from "../../database/prisma";
import { getQueue } from "../../database/bullmq";

export async function createTicket(userId: string, body: any) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const ticket = await p.supportTicket.create({
    data: {
      id: `ticket-${uuidv4().slice(0, 8)}`,
      userId,
      subject: body.subject,
      description: body.message || body.description || "",
      status: "OPEN",
      priority: (body.priority || "MEDIUM").toUpperCase() as any,
      category: body.category || "general",
    },
  });
  const q = getQueue("notification");
  if (q) await q.add("ticket-created", { ticketId: ticket.id, userId });
  return ticket;
}

export async function listTickets(userId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  return p.supportTicket.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function getTicket(ticketId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const ticket = await p.supportTicket.findUnique({ where: { id: ticketId }, include: { messages: true } });
  return ticket || null;
}

export async function addMessage(userId: string, ticketId: string, body: any) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const ticket = await p.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw Object.assign(new Error("Ticket not found"), { statusCode: 404 });
  const msg = await p.supportTicketMessage.create({
    data: { id: `msg-${uuidv4().slice(0, 8)}`, ticketId, senderId: userId, message: body.message },
  });
  return msg;
}

export async function closeTicket(userId: string, ticketId: string) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.supportTicket.update({ where: { id: ticketId }, data: { status: "CLOSED" } });
}
