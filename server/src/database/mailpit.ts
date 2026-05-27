import nodemailer from "nodemailer";
import { config } from "../config";

let _transporter: nodemailer.Transporter | null = null;

export function getMailer(): nodemailer.Transporter | null {
  if (_transporter) return _transporter;
  try {
    _transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      ignoreTLS: true,
    });
    console.log("[MAILPIT] Email transport ready");
    return _transporter;
  } catch {
    console.warn("[MAILPIT] Unavailable");
    return null;
  }
}

export async function sendEmail(to: string, subject: string, text: string) {
  const t = getMailer();
  if (!t) return;
  await t.sendMail({ from: config.emailFrom, to, subject, text });
}
