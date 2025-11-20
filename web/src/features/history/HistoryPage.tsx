import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/authContext";
import { getEvents } from "@/api/events";
import { addHistory, getUserHistory } from "@/api/history";
import { sendNotification } from "@/api/notifications";
import axios from "axios";

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
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/users");
        setUsers(response.data);
        // Set default to logged-in user if available
        if (user && !selectedUserId) {
          setSelectedUserId(String(user.id));
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [user, selectedUserId]);

  // Fetch history for selected user
  useEffect(() => {
    if (!selectedUserId) {
      setMatches([]);
      return;
    }
    
    getUserHistory(selectedUserId)
      .then((data) => {
        const transformed = data.map((record: any) => ({
          id: record.id,
          volunteerId: record.userId,
          eventId: record.eventId,
          status: record.activityType?.includes("Matched") ? "Matched" :
                 record.activityType?.includes("Confirmed") ? "Confirmed" :
                 record.activityType?.includes("Completed") ? "Completed" :
                 record.activityType?.includes("No-show") ? "No-show" : "Matched",
          createdAt: record.timestamp || record.createdAt,
        }));
        
        const eventMap = new Map<string, typeof transformed[0]>();
        transformed.forEach((record) => {
          const existing = eventMap.get(record.eventId);
          if (!existing || new Date(record.createdAt) > new Date(existing.createdAt)) {
            eventMap.set(record.eventId, record);
          }
        });
        
        setMatches(Array.from(eventMap.values()));
      })
      .catch((err) => console.error("Error fetching history:", err));
  }, [selectedUserId]);

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
          event: events.find((e) => String(e.id) === String(m.eventId)),
        }))
        .sort((a, b) => {
          const dateA = a.event?.date || "";
          const dateB = b.event?.date || "";
          return dateB.localeCompare(dateA);
        }),
    [matches, events, filter]
  );

  const stats = useMemo(() => {
    const total = matches.length;
    const completed = matches.filter((m) => m.status === "Completed").length;
    const confirmed = matches.filter((m) => m.status === "Confirmed").length;
    const matched = matches.filter((m) => m.status === "Matched").length;
    const noShow = matches.filter((m) => m.status === "No-show").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const upcomingEvents = rows.filter((row) => {
      if (!row.event?.date) return false;
      const eventDate = new Date(row.event.date);
      return eventDate >= new Date() && (row.match.status === "Matched" || row.match.status === "Confirmed");
    });
    
    const pastEvents = rows.filter((row) => {
      if (!row.event?.date) return false;
      const eventDate = new Date(row.event.date);
      return eventDate < new Date() || row.match.status === "Completed" || row.match.status === "No-show";
    });

    return {
      total,
      completed,
      confirmed,
      matched,
      noShow,
      completionRate,
      upcomingEvents: upcomingEvents.length,
      pastEvents: pastEvents.length,
    };
  }, [matches, rows]);

  const onUpdateStatus = async (id: string, status: MatchRecord["status"]) => {
    if (!selectedUserId) return;

    try {
      const match = matches.find((m) => m.id === id);
      if (!match) return;

      await addHistory({
        userId: selectedUserId,
        eventId: String(match.eventId),
        activityType: status,
        details: `Event status updated to ${status}`,
      });

      await sendNotification({
        userId: selectedUserId,
        eventId: String(match.eventId),
        message: `Your event status has been updated to ${status}.`,
      });

      const data = await getUserHistory(selectedUserId);
      const transformed = data.map((record: any) => ({
        id: record.id,
        volunteerId: record.userId,
        eventId: record.eventId,
        status: record.activityType?.includes("Matched") ? "Matched" :
               record.activityType?.includes("Confirmed") ? "Confirmed" :
               record.activityType?.includes("Completed") ? "Completed" :
               record.activityType?.includes("No-show") ? "No-show" : "Matched",
        createdAt: record.timestamp || record.createdAt,
      }));
      
      const eventMap = new Map<string, typeof transformed[0]>();
      transformed.forEach((record) => {
        const existing = eventMap.get(record.eventId);
        if (!existing || new Date(record.createdAt) > new Date(existing.createdAt)) {
          eventMap.set(record.eventId, record);
        }
      });
      
      setMatches(Array.from(eventMap.values()));
    } catch (err) {
      console.error("Error updating history status:", err);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Volunteer History</h1>
        <p className="text-zinc-400">
          View volunteer activities, upcoming events, and impact for any user.
        </p>
      </div>

      {/* User Selector */}
      <div className="mb-6">
        <label htmlFor="userSelect" className="block mb-2 text-sm font-medium text-zinc-200">
          Select User:
        </label>
        <select
          id="userSelect"
          className="rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 p-2 min-w-[300px]"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="">-- Select a user --</option>
          {users.map((u) => (
            <option key={u.id} value={String(u.id)}>
              {u.fullName || u.email} {u.id === user?.id ? "(You)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
          <p className="text-zinc-400 text-sm mb-1">Total Events</p>
          <p className="text-2xl font-bold text-zinc-200">{stats.total}</p>
        </div>
        <div className="p-4 bg-green-600/10 rounded-lg border border-green-600/50">
          <p className="text-green-400 text-sm mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
        </div>
        <div className="p-4 bg-blue-600/10 rounded-lg border border-blue-600/50">
          <p className="text-blue-400 text-sm mb-1">Upcoming</p>
          <p className="text-2xl font-bold text-blue-400">{stats.upcomingEvents}</p>
        </div>
        <div className="p-4 bg-yellow-600/10 rounded-lg border border-yellow-600/50">
          <p className="text-yellow-400 text-sm mb-1">Completion Rate</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.completionRate}%</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="filterSelect" className="text-sm text-zinc-200">
          Filter by Status:
        </label>
        <select
          id="filterSelect"
          className="rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 p-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Events</option>
          <option value="Matched">Matched</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="No-show">No-show</option>
        </select>
        <span className="text-sm text-zinc-400 ml-2">
          Showing {rows.length} of {stats.total} events
        </span>
      </div>

      {!selectedUserId ? (
        <div className="text-center py-12 bg-zinc-800 rounded-lg border border-zinc-700">
          <p className="text-zinc-400 text-lg mb-2">Select a user to view their history</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 bg-zinc-800 rounded-lg border border-zinc-700">
          <p className="text-zinc-400 text-lg mb-2">No volunteer history yet for this user</p>
          <p className="text-zinc-500 text-sm">
            Start volunteering by matching with events on the Match page
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(({ match, event }) => {
            const isUpcoming = event?.date && new Date(event.date) >= new Date();
            const isPast = event?.date && new Date(event.date) < new Date();
            
            return (
              <div
                key={match.id}
                className={`p-5 rounded-lg border ${
                  match.status === "Completed"
                    ? "bg-green-600/10 border-green-600/50"
                    : match.status === "Confirmed"
                    ? "bg-blue-600/10 border-blue-600/50"
                    : match.status === "No-show"
                    ? "bg-red-600/10 border-red-600/50"
                    : "bg-zinc-800 border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-zinc-200">
                        {event?.name || `Event ${match.eventId}`}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          match.status === "Completed"
                            ? "bg-green-600 text-white"
                            : match.status === "Confirmed"
                            ? "bg-blue-600 text-white"
                            : match.status === "No-show"
                            ? "bg-red-600 text-white"
                            : "bg-zinc-600 text-zinc-300"
                        }`}
                      >
                        {match.status}
                      </span>
                      {isUpcoming && (
                        <span className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 text-xs">
                          Upcoming
                        </span>
                      )}
                      {isPast && match.status !== "Completed" && match.status !== "No-show" && (
                        <span className="px-2 py-1 rounded bg-yellow-600/20 text-yellow-400 text-xs">
                          Past Event
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-zinc-300 mb-2">
                      {event?.date && (
                        <span>📅 {new Date(event.date).toLocaleDateString("en-US", { 
                          weekday: "short", 
                          year: "numeric", 
                          month: "short", 
                          day: "numeric" 
                        })}</span>
                      )}
                      {event?.location && <span>📍 {event.location}</span>}
                      {event?.urgency && (
                        <span className={`${
                          event.urgency === "High"
                            ? "text-red-400"
                            : event.urgency === "Medium"
                            ? "text-yellow-400"
                            : "text-zinc-400"
                        }`}>
                          ⚠ {event.urgency} Priority
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">
                      Matched on {new Date(match.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {match.status !== "Completed" && match.status !== "No-show" && (
                  <div className="flex gap-2 pt-3 border-t border-zinc-700">
                    <button
                      className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition text-sm font-medium"
                      onClick={() => onUpdateStatus(match.id, "Confirmed")}
                    >
                      ✓ Confirm Attendance
                    </button>
                    {match.status === "Confirmed" && (
                      <button
                        className="px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 transition text-sm font-medium"
                        onClick={() => onUpdateStatus(match.id, "Completed")}
                      >
                        ✓ Mark Complete
                      </button>
                    )}
                    <button
                      className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 transition text-sm font-medium"
                      onClick={() => onUpdateStatus(match.id, "No-show")}
                    >
                      Report No-show
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
