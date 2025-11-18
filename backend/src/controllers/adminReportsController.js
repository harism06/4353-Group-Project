import {
  eventsReportQuerySchema,
  volunteersReportQuerySchema,
} from "../validations/reportSchema.js";
import {
  buildEventsReportData,
  buildVolunteersReportData,
} from "../services/reportDataService.js";
import { sendEventsPdf, sendVolunteersPdf } from "../services/reportPdfService.js";
import { sendEventsCsv, sendVolunteersCsv } from "../services/reportCsvService.js";

const resolveFormat = (req, fallback = "pdf") =>
  (req.params?.format || req.query?.format || fallback).toLowerCase();

export async function getEventsReport(req, res) {
  const parseResult = eventsReportQuerySchema.safeParse({
    ...req.query,
    format: resolveFormat(req),
  });
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: parseResult.error.flatten(),
    });
  }

  const { format, ...filters } = parseResult.data;
  const data = await buildEventsReportData(filters);

  if (format === "pdf") {
    return sendEventsPdf({ res, ...data });
  }
  if (format === "csv") {
    return sendEventsCsv({ res, ...data });
  }

  return res.json(data);
}

export async function getVolunteersReport(req, res) {
  const parseResult = volunteersReportQuerySchema.safeParse({
    ...req.query,
    format: resolveFormat(req),
  });
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: parseResult.error.flatten(),
    });
  }

  const { format, ...filters } = parseResult.data;
  const data = await buildVolunteersReportData(filters);

  if (format === "pdf") {
    return sendVolunteersPdf({ res, ...data });
  }
  if (format === "csv") {
    return sendVolunteersCsv({ res, ...data });
  }

  return res.json(data);
}
