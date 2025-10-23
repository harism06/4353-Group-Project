import { PrismaClient } from "@prisma/client";

const rawDbUrl = process.env.DATABASE_URL;
if (rawDbUrl?.startsWith("file:./")) {
  const absolute = new URL(rawDbUrl.slice(5), new URL("../../", import.meta.url));
  process.env.DATABASE_URL = absolute.href;
}

export const prisma = new PrismaClient();

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
