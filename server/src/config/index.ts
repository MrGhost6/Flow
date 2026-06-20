import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  bcryptRounds: 12,
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtRefreshSecret: process.env.REFRESH_SECRET || "change-me-in-production",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  databaseUrl: process.env.DATABASE_URL || "postgresql://localhost:5432/flow_fintech",
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
    accessKey: process.env.MINIO_ACCESS_KEY || "",
    secretKey: process.env.MINIO_SECRET_KEY || "",
    region: process.env.MINIO_REGION || "us-east-1",
  },
  smtp: {
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT || "1025", 10),
  },
  emailFrom: process.env.EMAIL_FROM || "noreply@flow.finance",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
};
