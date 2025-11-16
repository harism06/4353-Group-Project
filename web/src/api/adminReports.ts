import api from "@/lib/axios";

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

type ReportFilters = {
  startDate?: string;
  endDate?: string;
  eventId?: string;
  skills?: string[];
  format: "csv" | "pdf";
};

type VolunteerReportFilters = Omit<ReportFilters, "eventId">;
type EventReportFilters = Omit<ReportFilters, "skills">;

// Download Volunteers Report (uses /admin/reports/users endpoint)
export async function downloadVolunteersReport(
  filters: VolunteerReportFilters,
  filename: string
) {
  const params: any = { format: filters.format, role: "volunteer" };

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.skills && filters.skills.length > 0) {
    params.skills = filters.skills.join(",");
  }

  const res = await api.get("/admin/reports/users", {
    params,
    responseType: "blob",
  });

  const mimeType = filters.format === "pdf" ? "application/pdf" : "text/csv";
  downloadBlob(new Blob([res.data], { type: mimeType }), filename);
}

// Download Events Report
export async function downloadEventsReport(
  filters: EventReportFilters,
  filename: string
) {
  const params: any = { format: filters.format };

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.eventId) params.eventId = filters.eventId;

  const res = await api.get("/admin/reports/events", {
    params,
    responseType: "blob",
  });

  const mimeType = filters.format === "pdf" ? "application/pdf" : "text/csv";
  downloadBlob(new Blob([res.data], { type: mimeType }), filename);
}

// Preview Volunteers Report (JSON only - uses /admin/reports/users)
export async function previewVolunteersReport(filters: {
  startDate?: string;
  endDate?: string;
  skills?: string[];
}): Promise<any[]> {
  const params: any = { format: "json", role: "volunteer" };

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.skills && filters.skills.length > 0) {
    params.skills = filters.skills.join(",");
  }

  const res = await api.get("/admin/reports/users", { params });
  const data = res.data.users || res.data.data || res.data || [];
  return Array.isArray(data) ? data.slice(0, 5) : [];
}

// Preview Events Report (JSON only)
export async function previewEventsReport(filters: {
  startDate?: string;
  endDate?: string;
  eventId?: string;
}): Promise<any[]> {
  const params: any = { format: "json" };

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.eventId) params.eventId = filters.eventId;

  const res = await api.get("/admin/reports/events", { params });
  const data = res.data.events || res.data.data || res.data || [];
  return Array.isArray(data) ? data.slice(0, 5) : [];
}

// Legacy functions (keep for backward compatibility with Dashboard.tsx)
export async function downloadEventsReportPdf() {
  const res = await api.get("/admin/reports/events", {
    params: { format: "pdf" },
    responseType: "blob",
  });
  downloadBlob(new Blob([res.data], { type: "application/pdf" }), "events.pdf");
}

export async function downloadUsersReportPdf() {
  const res = await api.get("/admin/reports/users", {
    params: { format: "pdf" },
    responseType: "blob",
  });
  downloadBlob(new Blob([res.data], { type: "application/pdf" }), "users.pdf");
}
