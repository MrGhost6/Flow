import { getPrisma } from "../../database/prisma";
import { getUser } from "../../lib/dbHelpers";
import { auditLog } from "../../common/utils/audit";

export async function getProfile(userId: string) {
  const user: any = await getUser(userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function updateProfile(userId: string, data: any) {
  const user: any = await getUser(userId);
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  const allowed = ['name', 'phone', 'avatarUrl', 'locale', 'timezone'];
  const filtered: any = {};
  for (const key of allowed) {
    if (data[key] !== undefined) filtered[key] = data[key];
  }
  Object.assign(user, filtered);
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  await p.user.update({ where: { id: user.id }, data: filtered });
  await auditLog(userId, "USER_UPDATE", "AUTH", "Profile updated");
  return user;
}

export async function updateSettings(userId: string, data: any) {
  const p = getPrisma();
  if (!p) throw new Error("Database unavailable");
  const allowed = ['name', 'phone', 'avatarUrl', 'locale', 'timezone'];
  const filtered: any = {};
  for (const key of allowed) {
    if (data[key] !== undefined) filtered[key] = data[key];
  }
  await p.user.update({ where: { id: userId }, data: filtered });
  await auditLog(userId, "SETTINGS_ADJUSTED", "SECURITY", "Notification preferences updated");
  return { updated: true };
}
