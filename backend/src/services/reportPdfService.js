import { PassThrough } from "stream";

let PDFDocument;
try {
  const mod = await import("pdfkit");
  PDFDocument = mod.default || mod;
} catch (error) {
  console.warn("[reports] pdfkit not available, falling back to mock PDF output");
  PDFDocument = class MockPdfDocument extends PassThrough {
    fontSize() {
      return this;
    }
    text() {
      return this;
    }
    moveDown() {
      return this;
    }
    moveTo() {
      return this;
    }
    lineTo() {
      return this;
    }
    stroke() {
      return this;
    }
  };
}

const formatDate = (value) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toISOString().slice(0, 10);
};

const writeSummary = (doc, summary, yOffset = 0) => {
  doc.moveDown(yOffset);
  doc.fontSize(12).text("Summary", { underline: true });
  doc.fontSize(10);
  doc.text(`Total events: ${summary.totalEvents ?? 0}`);
  doc.text(`Total volunteers: ${summary.totalVolunteers ?? 0}`);
  doc.text(`Total hours: ${summary.totalHours ?? 0}`);
  doc.text(`Completed assignments: ${summary.completedAssignments ?? 0}`);
  doc.text(`Pending assignments: ${summary.pendingAssignments ?? 0}`);
};

const writeHeader = (doc, title) => {
  doc.fontSize(18).text(title, { align: "center" });
  doc.moveDown();
  doc.fontSize(10).text(`Generated at: ${new Date().toISOString()}`, {
    align: "right",
  });
  doc.moveDown();
};

const formatFilters = (filters) =>
  Object.entries(filters ?? {})
    .filter(([, value]) => {
      if (!value) return false;
      if (Array.isArray(value)) return value.length > 0;
      return String(value).trim().length > 0;
    })
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`);

export function sendEventsPdf({ res, filters, summary, events }) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="events_report.pdf"'
  );

  doc.pipe(res);
  writeHeader(doc, "Event Assignments Report");

  const appliedFilters = formatFilters({
    "Start date": filters.startDate || "",
    "End date": filters.endDate || "",
    Event: filters.eventId || "",
  });
  doc.fontSize(11).text("Filters:", { underline: true });
  doc.fontSize(10);
  if (appliedFilters.length === 0) {
    doc.text("None");
  } else {
    appliedFilters.forEach((line) => doc.text(line));
  }
  doc.moveDown();

  doc.fontSize(11);
  doc.text("Event", { continued: true, width: 150 });
  doc.text("Date", { continued: true, width: 70 });
  doc.text("Location", { continued: true, width: 120 });
  doc.text("Assigned", { continued: true, width: 60 });
  doc.text("Completed", { continued: true, width: 70 });
  doc.text("Hours", { width: 60 });

  doc.moveDown(0.2);
  doc.moveTo(doc.x, doc.y).lineTo(540, doc.y).stroke();
  doc.moveDown(0.4);

  events.forEach((event) => {
    doc.text(event.name, { continued: true, width: 150 });
    doc.text(formatDate(event.eventDate), { continued: true, width: 70 });
    doc.text(event.location, { continued: true, width: 120 });
    doc.text(String(event.totalAssignments), { continued: true, width: 60 });
    doc.text(String(event.completedAssignments), { continued: true, width: 70 });
    doc.text(String(event.totalHours), { width: 60 });
    const volunteerLine = event.volunteerDetails
      .map((v) => `${v.volunteerName} (${v.status})`)
      .join(", ");
    doc.fontSize(9).text(`Volunteers: ${volunteerLine || "None"}`, { width: 520 });
    doc.moveDown(0.5);
    doc.fontSize(11);
  });

  writeSummary(doc, summary, 0.5);
  doc.end();
}

export function sendVolunteersPdf({ res, filters, summary, volunteers }) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="volunteers_report.pdf"'
  );

  doc.pipe(res);
  writeHeader(doc, "Volunteer Participation Report");

  const appliedFilters = formatFilters({
    "Start date": filters.startDate || "",
    "End date": filters.endDate || "",
    Skills: Array.isArray(filters.skills) ? filters.skills : [],
  });
  doc.fontSize(11).text("Filters:", { underline: true });
  doc.fontSize(10);
  if (appliedFilters.length === 0) {
    doc.text("None");
  } else {
    appliedFilters.forEach((line) => doc.text(line));
  }
  doc.moveDown();

  doc.fontSize(11);
  doc.text("Volunteer", { continued: true, width: 150 });
  doc.text("Email", { continued: true, width: 140 });
  doc.text("Events", { continued: true, width: 50 });
  doc.text("Hours", { continued: true, width: 60 });
  doc.text("Completed", { continued: true, width: 70 });
  doc.text("Pending", { continued: true, width: 60 });
  doc.text("Last Event", { width: 80 });

  doc.moveDown(0.2);
  doc.moveTo(doc.x, doc.y).lineTo(540, doc.y).stroke();
  doc.moveDown(0.4);

  volunteers.forEach((volunteer) => {
    doc.text(volunteer.volunteerName, { continued: true, width: 150 });
    doc.text(volunteer.email || "-", { continued: true, width: 140 });
    doc.text(String(volunteer.totalEvents), { continued: true, width: 50 });
    doc.text(String(volunteer.totalHours), { continued: true, width: 60 });
    doc.text(String(volunteer.completedAssignments), { continued: true, width: 70 });
    doc.text(String(volunteer.pendingAssignments), { continued: true, width: 60 });
    doc.text(formatDate(volunteer.lastEventDate), { width: 80 });
    doc.fontSize(9).text(`Skills: ${volunteer.skills?.join(", ") || "-"}`);
    const eventsLine = volunteer.events
      .map((evt) => `${evt.eventName} (${evt.status})`)
      .join(", ");
    doc.fontSize(9).text(`Events: ${eventsLine || "None"}`);
    doc.moveDown(0.5);
    doc.fontSize(11);
  });

  writeSummary(doc, summary, 0.5);
  doc.end();
}
