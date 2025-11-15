import prisma from "../db/prisma.js";
import {
  eventsReportQuerySchema,
  usersReportQuerySchema,
} from "../validations/reportSchema.js";
import { sendEventsPdf, sendUsersPdf } from "../services/reportPdfService.js";

export async function getEventsReport(req, res) {
  const parseResult = eventsReportQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: parseResult.error.flatten(),
    });
  }

  const { startDate, endDate, urgency, format } = parseResult.data;

  // Build Prisma "where"
  const where = {};
  if (startDate || endDate) {
    where.eventDate = {};
    if (startDate) where.eventDate.gte = new Date(startDate);
    if (endDate) where.eventDate.lte = new Date(endDate);
  }
  if (urgency) {
    where.urgency = urgency;
  }

  const events = await prisma.eventDetails.findMany({
    where,
    orderBy: { eventDate: "asc" },
  });

  const filters = { startDate, endDate, urgency };

  if (format === "pdf") {
    return sendEventsPdf({ res, filters, events });
  }

  // default JSON (useful for debugging / demo)
  return res.json({ filters, events });
}

export async function getUsersReport(req, res) {
  const parseResult = usersReportQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: parseResult.error.flatten(),
    });
  }

  const { role, format } = parseResult.data;

  const where = {};
  if (role) where.role = role;

  const users = await prisma.userCredentials.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  const filters = { role };

  if (format === "pdf") {
    return sendUsersPdf({ res, filters, users });
  }

  return res.json({ filters, users });
}
