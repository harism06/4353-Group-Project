const formatDate = (value) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toISOString().slice(0, 10);
};

const escapeCell = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const rowsToCsv = (rows) => rows.map((row) => row.map(escapeCell).join(",")).join("\n");

const sendCsv = (res, filename, sections) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(sections.filter(Boolean).join("\n\n"));
};

const buildSummarySection = (summary) =>
  rowsToCsv([
    ["Metric", "Value"],
    ["Total events", summary.totalEvents ?? 0],
    ["Total volunteers", summary.totalVolunteers ?? 0],
    ["Total hours", summary.totalHours ?? 0],
    ["Completed assignments", summary.completedAssignments ?? 0],
    ["Pending assignments", summary.pendingAssignments ?? 0],
  ]);

export function sendEventsCsv({ res, summary, events }) {
  const summarySection = buildSummarySection(summary);
  const eventHeader = [
    "Event",
    "Date",
    "Location",
    "Assigned",
    "Completed",
    "Pending",
    "Hours",
    "Volunteers",
  ];
  const eventRows = events.map((event) => [
    event.name,
    formatDate(event.eventDate),
    event.location,
    event.totalAssignments,
    event.completedAssignments,
    event.pendingAssignments,
    event.totalHours,
    event.volunteerDetails.map((v) => `${v.volunteerName} (${v.status})`).join("; "),
  ]);
  const eventSection = rowsToCsv([eventHeader, ...eventRows]);
  sendCsv(res, "events_report.csv", [summarySection, eventSection]);
}

export function sendVolunteersCsv({ res, summary, volunteers }) {
  const summarySection = buildSummarySection(summary);
  const volunteerHeader = [
    "Volunteer",
    "Email",
    "Total Events",
    "Total Hours",
    "Completed",
    "Pending",
    "Last Event",
    "Skills",
  ];
  const volunteerRows = volunteers.map((volunteer) => [
    volunteer.volunteerName,
    volunteer.email || "-",
    volunteer.totalEvents,
    volunteer.totalHours,
    volunteer.completedAssignments,
    volunteer.pendingAssignments,
    formatDate(volunteer.lastEventDate),
    (volunteer.skills || []).join("; "),
  ]);
  const volunteerSection = rowsToCsv([volunteerHeader, ...volunteerRows]);
  sendCsv(res, "volunteers_report.csv", [summarySection, volunteerSection]);
}
