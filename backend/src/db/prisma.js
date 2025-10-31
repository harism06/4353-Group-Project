import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";

const ensureAbsoluteSqlitePath = (url) => {
  if (!url?.startsWith("file:")) return url;
  if (!url.startsWith("file:./") && !url.startsWith("file:../")) return url;

  const relative = url.slice("file:".length);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(__dirname, "..", "..");
  const absolute = path.resolve(projectRoot, relative);
  return `file:${absolute}`;
};

process.env.DATABASE_URL = ensureAbsoluteSqlitePath(process.env.DATABASE_URL);

const prisma = new PrismaClient();

export default prisma;
