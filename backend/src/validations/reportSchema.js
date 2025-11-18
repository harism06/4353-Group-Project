import { z } from "zod";

const optionalIsoDate = z
  .preprocess((value) => {
    if (!value) return undefined;
    const str = String(value).trim();
    if (!str) return undefined;
    return Number.isNaN(Date.parse(str)) ? undefined : str;
  }, z.string().optional());

const csvFormatEnum = z.enum(["json", "pdf", "csv"]).default("pdf");

export const eventsReportQuerySchema = z.object({
  startDate: optionalIsoDate,
  endDate: optionalIsoDate,
  eventId: z.string().trim().min(1).optional(),
  format: csvFormatEnum,
});

export const volunteersReportQuerySchema = z.object({
  startDate: optionalIsoDate,
  endDate: optionalIsoDate,
  skills: z
    .preprocess((value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        return value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return [];
    }, z.array(z.string()))
    .optional(),
  format: csvFormatEnum,
});
