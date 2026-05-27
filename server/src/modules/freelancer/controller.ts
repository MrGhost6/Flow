import { Controller } from "../../common/types";

export const clients: Controller = async (req, res) => {
  const data = await (await import("./service")).getClients();
  return res.json(data);
};

export const addClient: Controller = async (req, res) => {
  const client = await (await import("./service")).addClient(req.userId!, req.body);
  return res.status(201).json(client);
};

export const invoices: Controller = async (req, res) => {
  const data = await (await import("./service")).getInvoices();
  return res.json(data);
};

export const createInvoice: Controller = async (req, res) => {
  const inv = await (await import("./service")).createInvoice(req.userId!, req.body);
  return res.status(201).json(inv);
};

export const earnings: Controller = async (req, res) => {
  const data = await (await import("./service")).getEarnings();
  return res.json(data);
};

export const estimateTax: Controller = async (req, res) => {
  const data = await (await import("./service")).estimateTax(req.userId!, req.body);
  return res.json(data);
};

export const createPaymentLink: Controller = async (req, res) => {
  const link = await (await import("./service")).createPaymentLink(req.userId!, req.body);
  return res.status(201).json(link);
};
