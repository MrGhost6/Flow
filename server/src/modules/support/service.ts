import { v4 as uuidv4 } from "uuid";

const tickets: any[] = [];

export async function createTicket(userId: string, body: any) {
  const ticket: any = { id: `ticket-${uuidv4().slice(0, 8)}`, userId, subject: body.subject, message: body.message, status: "open", priority: body.priority || "medium", category: body.category || "general", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  tickets.unshift(ticket);
  return ticket;
}

export async function listTickets(userId: string) {
  return tickets.filter((t: any) => t.userId === userId);
}

export async function getTicket(ticketId: string) {
  return tickets.find((t: any) => t.id === ticketId) || null;
}

export async function addMessage(userId: string, ticketId: string, body: any) {
  const ticket = tickets.find((t: any) => t.id === ticketId);
  if (!ticket) throw Object.assign(new Error("Ticket not found"), { statusCode: 404 });
  const msg: any = { id: `msg-${uuidv4().slice(0, 8)}`, ticketId, userId, message: body.message, createdAt: new Date().toISOString() };
  ticket.messages = ticket.messages || [];
  ticket.messages.push(msg);
  ticket.updatedAt = new Date().toISOString();
  return msg;
}

export async function closeTicket(userId: string, ticketId: string) {
  const ticket = tickets.find((t: any) => t.id === ticketId);
  if (ticket) ticket.status = "closed";
}
