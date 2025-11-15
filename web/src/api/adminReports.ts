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
