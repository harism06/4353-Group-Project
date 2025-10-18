import api from "@/lib/axios";

export type NotificationItem = {
  id: string;
  userId: string;
  message: string;
  read?: boolean;
  createdAt?: string;
};

/** List my notifications (tries /notifications/me, falls back to /notifications + local filtering) */
export async function getMyNotifications(): Promise<NotificationItem[]> {
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

/** Mark one notification as read (PUT, fallback to PATCH) */
export async function markNotificationRead(id: string) {
  try {
    return await api.put(`/notifications/${id}`, { read: true });
  } catch {
    return api.patch(`/notifications/${id}`, { read: true });
  }
}

/** Mark all notifications as read (server route; fallback loops client-side) */
export async function markAllRead() {
  try {
    return await api.post("/notifications/read-all");
  } catch {
    const list = await getMyNotifications();
    await Promise.all(list.map((n) => markNotificationRead(n.id)));
  }
}

/** ✅ Provide the missing export used by NotificationToast.tsx */
export async function sendNotification(payload: {
  userId: string;
  message: string;
  eventId?: string;
}) {
  // primary route
  try {
    return await api.post("/notifications", payload);
  } catch {
    // optional alternate route name if your backend differs
    return api.post("/notify", payload);
  }
}
