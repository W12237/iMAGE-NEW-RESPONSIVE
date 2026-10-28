import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const COOKIE = "image_admin_session";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await prisma.adminSession.create({ data: { tokenHash: hash(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}

export async function getAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return prisma.adminSession.findFirst({ where: { tokenHash: hash(token), expiresAt: { gt: new Date() } }, include: { user: true } }).then(s => s?.user ?? null);
}

export async function requireAdmin() { const user = await getAdmin(); if (!user) redirect("/admin/login"); return user; }
export async function destroySession() {
  const store = await cookies(); const token = store.get(COOKIE)?.value;
  if (token) await prisma.adminSession.deleteMany({ where: { tokenHash: hash(token) } });
  store.delete(COOKIE);
}
