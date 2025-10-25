import { z } from "zod";

const toLower = (v) => v.toLowerCase();
const toLowerTrim = (v) => v.trim().toLowerCase();

export const identifier = z
  .string()
  .min(1, "Identifier is required")
  .trim()
  .transform(toLower);

export const loginSchema = z.object({
  identifier,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(100, "Username must be at most 100 characters")
    .trim()
    .regex(/^[a-z0-9_]+$/i, "Only letters, numbers and underscores")
    .transform(toLower),
  email: z.string().email("Invalid email").transform(toLowerTrim),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "volunteer"]).optional().default("volunteer"),
});
