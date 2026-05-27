import { Request, Response } from "express";
import * as analyticsService from "./service";

export async function overview(req: Request, res: Response) {
  const data = await analyticsService.getOverview(req.userId!);
  return res.json(data);
}
export async function spending(req: Request, res: Response) {
  const data = await analyticsService.getSpending(req.userId!);
  return res.json(data);
}
export async function cashflow(req: Request, res: Response) {
  const data = await analyticsService.getCashflow(req.userId!);
  return res.json(data);
}
export async function trends(req: Request, res: Response) {
  const data = await analyticsService.getTrends(req.userId!);
  return res.json(data);
}
export async function categories(req: Request, res: Response) {
  const data = await analyticsService.getCategories(req.userId!);
  return res.json(data);
}
export async function monthlyReport(req: Request, res: Response) {
  const data = await analyticsService.getMonthlyReport(req.userId!);
  return res.json(data);
}
