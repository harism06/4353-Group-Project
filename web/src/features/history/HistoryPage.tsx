// web/src/features/history/HistoryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/authContext";
import api from "@/lib/axios";

type MatchRecord = {
  id: string;
  volunteerId: string;
  eventId: string;
  status: "Matched" | "Confirmed" | "Completed" | "No-show" | "assigned";
  createdAt?: string;
};

type EventItem = {
  id: string;
  name: string;
  date?: string;
  location?: string;
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Load my history with resilient fallbacks
  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      try {
        const { data } = await api.get(`/users/${user.id}/history`);
        setMatches(
          (data ?? []).map((m: any) => ({
            ...m,
            id: String(m.id),
            eventId: String(m.eventId),
            volunteerId: String(m.volunteerId ?? user.id),
          }))
        );
      } catch {
        try {
          const { data } = await api.get("/history/me");
          setMatches(
            (data ?? []).map((m: any) => ({
              ...m,
              id: String(m.id),
              eventId: String(m.eventId),
              volunteerId: String(m.volunteerId ?? user.id),
            }))
          );
        } catch {
          try {
            const { data } = await api.get("/history");
            const mine = (data ?? []).filter(
              (m: any) => String(m.volunteerId ?? m.userId) === String(user.id)
            );
            setMatches(
              mine.map((m: any) => ({
                ...m,
                id: String(m.id),
                eventId: String(m.eventId),
                volunteerId: String(m.volunteerId ?? user.id),
              }))
            );
          } catch {
            setMatches([]);
          }
        }
      }
    })();
  }, [user?.id]);

  // Load events to render names/locations
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/events");
        setEvents((data ?? []).map((e: any) => ({ ...e, id: String(e.id) })));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const rows = useMemo(
    () =>
      matches
        .filter((m) => (filter === "all" ? true : m.status === filter))
        .map((m) => ({
          match: m,
          event: events.find((e) => e.id === m.eventId),
        })),
    [matches, events, filter]
  );

  async function onUpdateStatus(id: string, status: MatchRecord["status"]) {
    try {
      await api.put(`/history/${id}`, { status });
      setMatches((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      );
      setToast("Status updated.");
    } catch (err: any) {
      setToast(
        err?.response?.status === 403
          ? "You don’t have permission to change this status."
          : "Failed to update status."
      );
    } finally {
      setTimeout(() => setToast(null), 1500);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {toast && (
        <div
          className="mb-4 rounded-md border border-blue-300 bg-blue-50 p-3 text-blue-700"
          aria-live="polite"
        >
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-2">My History</h1>
      <p className="text-sm mb-4">
        Your matched events and participation status.
      </p>

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="filterSelect" className="text-sm">
          Filter
        </label>
        <select
          id="filterSelect"
          className="rounded-md border p-2 bg-white text-black"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="Matched">Matched</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="No-show">No-show</option>
          <option value="assigned">assigned</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">No history yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-black">
            <thead className="bg-zinc-100 text-black">
              <tr>
                <th className="text-left p-2 border">Event</th>
                <th className="text-left p-2 border">Date</th>
                <th className="text-left p-2 border">Location</th>
                <th className="text-left p-2 border">Status</th>
                <th className="text-left p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ match, event }) => (
                <tr key={match.id} className="odd:bg-white even:bg-zinc-50">
                  <td className="p-2 border">{event?.name || match.eventId}</td>
                  <td className="p-2 border">{event?.date || "-"}</td>
                  <td className="p-2 border">{event?.location || "-"}</td>
                  <td className="p-2 border">{match.status}</td>
                  <td className="p-2 border">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 rounded bg-blue-600 text-white"
                        onClick={() => onUpdateStatus(match.id, "Confirmed")}
                      >
                        Confirm
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-green-600 text-white"
                        onClick={() => onUpdateStatus(match.id, "Completed")}
                      >
                        Complete
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-red-600 text-white"
                        onClick={() => onUpdateStatus(match.id, "No-show")}
                      >
                        No-show
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
