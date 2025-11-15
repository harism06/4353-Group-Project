import PDFDocument from "pdfkit";

function formatDate(d) {
  if (!d) return "-";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function sendEventsPdf({ res, filters, events }) {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="events_report.pdf"'
  );

  doc.pipe(res);

  // Title
  doc.fontSize(18).text("Events Report", { align: "center" });
  doc.moveDown();

  // Generated at
  doc.fontSize(10).text(`Generated at: ${new Date().toISOString()}`, {
    align: "right",
  });
  doc.moveDown();

  // Filters
  doc.fontSize(11).text("Filters:", { underline: true });
  doc.fontSize(10);
  doc.text(`Start date: ${filters.startDate || "-"}`);
  doc.text(`End date: ${filters.endDate || "-"}`);
  doc.text(`Urgency: ${filters.urgency || "-"}`);
  doc.moveDown();

  // Table header
  doc.fontSize(11);
  doc.text("Name", { continued: true, width: 180 });
  doc.text("Date", { continued: true, width: 80 });
  doc.text("Location", { continued: true, width: 140 });
  doc.text("Urgency", { width: 80 });

  doc.moveDown(0.2);
  doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  // Rows
  events.forEach((ev) => {
    doc.text(ev.name, { continued: true, width: 180 });
    doc.text(formatDate(ev.eventDate), { continued: true, width: 80 });
    doc.text(ev.location, { continued: true, width: 140 });
    doc.text(ev.urgency, { width: 80 });
  });

  doc.moveDown();

  // Summary
  doc.fontSize(12).text("Summary", { underline: true });
  doc.fontSize(11).text(`Total events: ${events.length}`);

  doc.end(); // finalize
}

export function sendUsersPdf({ res, filters, users }) {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="users_report.pdf"'
  );

  doc.pipe(res);

  // Title
  doc.fontSize(18).text("Users Report", { align: "center" });
  doc.moveDown();

  // Generated at
  doc.fontSize(10).text(`Generated at: ${new Date().toISOString()}`, {
    align: "right",
  });
  doc.moveDown();

  // Filters
  doc.fontSize(11).text("Filters:", { underline: true });
  doc.fontSize(10);
  doc.text(`Role: ${filters.role || "-"}`);
  doc.moveDown();

  // Table header
  doc.fontSize(11);
  doc.text("Username", { continued: true, width: 180 });
  doc.text("Email", { continued: true, width: 200 });
  doc.text("Role", { continued: true, width: 80 });
  doc.text("Created", { width: 100 });

  doc.moveDown(0.2);
  doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  // Rows
  users.forEach((u) => {
    doc.text(u.username, { continued: true, width: 180 });
    doc.text(u.email, { continued: true, width: 200 });
    doc.text(u.role, { continued: true, width: 80 });
    doc.text(formatDate(u.createdAt), { width: 100 });
  });

  doc.moveDown();

  // Summary
  doc.fontSize(12).text("Summary", { underline: true });
  doc.fontSize(11).text(`Total users: ${users.length}`);

  doc.end();
}
