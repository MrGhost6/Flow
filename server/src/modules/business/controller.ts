import { Controller } from "../../common/types";

export const register: Controller = async (req, res) => {
  const biz = await (await import("./service")).register(req.userId!, req.body);
  return res.status(201).json(biz);
};

export const profile: Controller = async (req, res) => {
  const data = await (await import("./service")).getProfile();
  return res.json(data);
};

export const updateProfile: Controller = async (req, res) => {
  const data = await (await import("./service")).updateProfile(req.userId!, req.body);
  return res.json(data);
};

export const members: Controller = async (req, res) => {
  const data = await (await import("./service")).getMembers();
  return res.json(data);
};

export const addMember: Controller = async (req, res) => {
  const member = await (await import("./service")).addMember(req.userId!, req.body);
  return res.status(201).json(member);
};

export const removeMember: Controller = async (req, res) => {
  await (await import("./service")).removeMember(req.userId!, req.params.id);
  return res.status(204).end();
};

export const invoices: Controller = async (req, res) => {
  const data = await (await import("./service")).getInvoices();
  return res.json(data);
};

export const createInvoice: Controller = async (req, res) => {
  const inv = await (await import("./service")).createInvoice(req.userId!, req.body);
  return res.status(201).json(inv);
};

export const expenses: Controller = async (req, res) => {
  const data = await (await import("./service")).getExpenses();
  return res.json(data);
};

export const addExpense: Controller = async (req, res) => {
  const exp = await (await import("./service")).addExpense(req.userId!, req.body);
  return res.status(201).json(exp);
};

export const payroll: Controller = async (req, res) => {
  const result = await (await import("./service")).runPayroll(req.userId!, req.body);
  return res.json(result);
};
