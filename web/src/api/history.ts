import api from "@/lib/axios";

export type MatchRecord = {
  id: string;
  volunteerId?: string;
  userId?: string;
  eventId: string;
  status: "Matched" | "Confirmed" | "Completed" | "No-show" | string;
  createdAt?: string;
};

export async function getUserHistory(
  userId: string | number
): Promise<MatchRecord[]> {
  const uid = String(userId);
  const { data } = await api.get(`/history/${uid}`);
  return data;
}

/**
 * Our A3 backend accepts POST /history with { userId, eventId, status }.
 * We'll use "status" to log what changed.
 */
export async function addHistory(payload: {
  userId: string | number;
  eventId: string;
  status: string;
}) {
  const body = { ...payload, userId: String(payload.userId) };
  const { data } = await api.post("/history", body);
  return data;
}
