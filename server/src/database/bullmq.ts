import { Queue, Worker } from "bullmq";
import { getRedis } from "./redis";

let redis: any = null;
let _emailQueue: Queue | null = null;
let _notificationQueue: Queue | null = null;
let _fraudQueue: Queue | null = null;
let _transactionQueue: Queue | null = null;

export function initQueues() {
  const r = getRedis();
  if (!r) { console.warn("[BULLMQ] Redis unavailable — queues disabled"); return; }
  redis = r as any;
  _emailQueue = new Queue("flow-email", { connection: redis });
  _notificationQueue = new Queue("flow-notification", { connection: redis });
  _fraudQueue = new Queue("flow-fraud", { connection: redis });
  _transactionQueue = new Queue("flow-transaction", { connection: redis });
  console.log("[BULLMQ] Queues initialized");

  new Worker("flow-email", async (job) => {
    const { to, subject, text } = job.data;
    const { sendEmail } = await import("./mailpit");
    await sendEmail(to, subject, text);
  }, { connection: redis });

  new Worker("flow-notification", async (job) => {
    console.log("[NOTIFICATION]", job.data);
  }, { connection: redis });

  new Worker("flow-fraud", async (job) => {
    console.log("[FRAUD] Analyzing:", job.name, job.data);
    const { getPrisma } = await import("./prisma");
    const p = getPrisma();
    if (!p) return;
    if (job.name === "high-value-transfer") {
      const { userId, amount, currency, receiverId } = job.data;
      await p.fraudEvent.create({
        data: {
          id: `fraud-${job.id || Date.now()}`,
          userId,
          ruleName: "high-value-transfer",
          severity: "MEDIUM",
          status: "INVESTIGATING",
          description: `High value transfer: ${currency} ${amount} to ${receiverId}`,
        },
      });
    }
  }, { connection: redis });

  new Worker("flow-transaction", async (job) => {
    console.log("[TRANSACTION] Processing:", job.name, job.data);
  }, { connection: redis });
}

export function getQueue(name: "email" | "notification" | "fraud" | "transaction") {
  const map = { email: _emailQueue, notification: _notificationQueue, fraud: _fraudQueue, transaction: _transactionQueue };
  return map[name];
}
