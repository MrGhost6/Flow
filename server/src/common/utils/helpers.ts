import crypto from "crypto";

export function maskCardNumber(pan: string): { maskedPan: string; last4: string; panHash: string } {
  const clean = pan.replace(/\s+/g, "");
  const last4 = clean.slice(-4);
  return { maskedPan: `**** **** **** ${last4}`, last4, panHash: crypto.createHash("sha256").update(clean).digest("hex") };
}

export function hashDocNumber(doc: string): string {
  return crypto.createHash("sha256").update(doc).digest("hex");
}

export function generateRef(): string {
  return `FLOW-${Date.now()}-${crypto.randomInt(1000, 9999)}`;
}

export function generateInvNum(): string {
  return `INV-${new Date().getFullYear()}-${String(crypto.randomInt(1000, 9999))}`;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
