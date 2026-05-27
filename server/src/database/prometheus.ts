import promClient from "prom-client";

promClient.collectDefaultMetrics({ register: promClient.register });

export const httpRequestDuration = new promClient.Histogram({
  name: "flow_http_request_duration_ms",
  help: "HTTP request duration in ms",
  labelNames: ["method", "route", "status"],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
});
export const httpRequestsTotal = new promClient.Counter({
  name: "flow_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});
export const transactionsTotal = new promClient.Counter({
  name: "flow_transactions_total",
  help: "Total transactions processed",
  labelNames: ["type", "status", "currency"],
});
export const fraudEventsTotal = new promClient.Counter({
  name: "flow_fraud_events_total",
  help: "Total fraud events",
  labelNames: ["severity"],
});
export const otpRequestsTotal = new promClient.Counter({
  name: "flow_otp_requests_total",
  help: "Total OTP requests",
  labelNames: ["type"],
});
export const queueJobsTotal = new promClient.Counter({
  name: "flow_queue_jobs_total",
  help: "Total queue jobs",
  labelNames: ["queue", "status"],
});
export const register = promClient.register;
