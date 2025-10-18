import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/authContext";
import { getEvents } from "@/api/events";
import { addHistory, getUserHistory } from "@/api/history";
import { sendNotification } from "@/api/notifications";

type MatchRecord = {
  id: string;
  volunteerId: string;
  eventId: string;
  status: "Matched" | "Confirmed" | "Completed" | "No-show";
  createdAt: string;
};

type EventItem = {
  id: string;
  name: string;
  date: string;
  location: string;
  urgency: string;
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  // Fetch user's history records from backend
  useEffect(() => {
    if (!user) return;
    const userId = String(user.id);
    getUserHistory(userId)
      .then((data) => setMatches(data))
      .catch((err) => console.error("Error fetching history:", err));
  }, [user]);

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(data))
      .catch((err) => console.error("Error fetching events:", err));
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

  /**
   * Update the status of a history record
   * Creates a new history entry and sends a notification to the user
   */
  const onUpdateStatus = async (id: string, status: MatchRecord["status"]) => {
    if (!user) return;
    const userId = String(user.id);

    try {
      const match = matches.find((m) => m.id === id);
      if (!match) return;

      // Log the status change as a new history record
      await addHistory({
        userId,
        eventId: match.eventId,
        activityType: `Status changed to ${status}`,
        details: `Event status updated from ${match.status} to ${status}`,
      });

      // Send notification to user about the status change
      await sendNotification({
        userId,
        eventId: match.eventId,
        message: `Your event status has been updated to ${status}.`,
      });

      // Update local state
      setMatches((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      );
    } catch (err) {
      console.error("Error updating history status:", err);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
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
