import Decimal from "decimal.js";

export function toDecimal(n: any): Decimal {
  return new Decimal(n || 0);
}

export function fmtDecimal(d: Decimal): number {
  return d.toDecimalPlaces(2).toNumber();
}

export function toMoney(n: number): number {
  return fmtDecimal(toDecimal(n));
}
