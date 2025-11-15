import { z } from "zod";

export const eventsReportQuerySchema = z.object({
  startDate: z.string().datetime().optional(), // ISO string if used
  endDate: z.string().datetime().optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
  format: z.enum(["json", "pdf"]).default("pdf"),
});

export const usersReportQuerySchema = z.object({
  role: z.string().optional().default("volunteer"), // filter on role
  format: z.enum(["json", "pdf"]).default("pdf"),
});
