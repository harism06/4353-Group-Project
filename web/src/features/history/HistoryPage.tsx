import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/authContext";
import { eventsData, getUserMatches, saveUserMatches, type MatchRecord } from "@/mock/data";

export default function HistoryPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const matches = useMemo<MatchRecord[]>(() => {
    if (!user) return [];
    return getUserMatches(user.id);
  }, [user]);

  const rows = matches
    .filter((m) => (filter === "all" ? true : m.status === filter))
    .map((m) => ({
      match: m,
      event: eventsData.find((e) => e.id === m.eventId),
    }));

  const onUpdateStatus = (id: string, status: MatchRecord["status"]) => {
    if (!user) return;
    if (status === "No-show") {
      const next = matches.filter((m) => m.id !== id);
      saveUserMatches(user.id, next);
      window.location.reload();
      return;
    }
    const next = matches.map((m) => (m.id === id ? { ...m, status } : m));
    saveUserMatches(user.id, next);
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-2">My History</h1>
      <p className="text-sm mb-4">Your matched events and participation status.</p>

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm">Filter</label>
        <select
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


