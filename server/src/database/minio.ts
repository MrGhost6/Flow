import * as Minio from "minio";
import { config } from "../config";
import { URL } from "url";

let _minio: Minio.Client | null = null;

export function getMinio(): Minio.Client | null {
  if (_minio) return _minio;
  try {
    const url = new URL(config.minio.endpoint);
    _minio = new Minio.Client({
      endPoint: url.hostname,
      port: parseInt(url.port || "9000", 10),
      useSSL: url.protocol === "https:",
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
    console.log("[MINIO] Client initialized");
    return _minio;
  } catch {
    console.warn("[MINIO] Unavailable");
    return null;
  }
}

async function ensureBucket(name: string) {
  const mc = getMinio();
  if (!mc) return;
  const exists = await mc.bucketExists(name);
  if (!exists) await mc.makeBucket(name, config.minio.region);
}

export async function initBuckets() {
  await Promise.allSettled([
    ensureBucket("flow-kyc"),
    ensureBucket("flow-invoices"),
    ensureBucket("flow-avatars"),
    ensureBucket("flow-reports"),
  ]);
}
