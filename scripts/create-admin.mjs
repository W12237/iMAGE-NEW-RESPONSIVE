import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 12) { console.error("Usage: pnpm admin:create admin@example.com 'password-at-least-12-chars'"); process.exit(1); }
const db = new PrismaClient();
await db.adminUser.upsert({ where:{email:email.toLowerCase()}, update:{passwordHash:await hash(password,12)}, create:{email:email.toLowerCase(),passwordHash:await hash(password,12)} });
console.log(`Admin ready: ${email.toLowerCase()}`); await db.$disconnect();
