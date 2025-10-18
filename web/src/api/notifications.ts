import api from "@/lib/axios";

export type NotificationItem = {
  id: string;
  userId: string;
  message: string;
  read?: boolean;
  createdAt?: string;
};

export async function getMyNotifications(): Promise<NotificationItem[]> {
  // Prefer backend “me” route; fall back to listing then filtering client-side.
  try {
    const { data } = await api.get("/notifications/me");
    return (data ?? []).map((n: any) => ({ ...n, id: String(n.id) }));
  } catch {
    const { data } = await api.get("/notifications");
    const me = JSON.parse(localStorage.getItem("user") || "null");
    const mine = (data ?? []).filter(
      (n: any) => String(n.userId) === String(me?.id)
    );
    return mine.map((n: any) => ({ ...n, id: String(n.id) }));
  }
}

export async function markNotificationRead(id: string) {
  try {
    return await api.put(`/notifications/${id}`, { read: true });
  } catch {
    // fallback if backend uses PATCH
    return api.patch(`/notifications/${id}`, { read: true });
  }
}

export async function markAllRead() {
  try {
    return await api.post("/notifications/read-all");
  } catch {
    const list = await getMyNotifications();
    await Promise.all(list.map((n) => markNotificationRead(n.id)));
  }
}
