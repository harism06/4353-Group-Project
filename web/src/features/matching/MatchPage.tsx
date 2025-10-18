import { useEffect, useState } from "react";
import axios from "axios";

type MatchSuggestion = {
  volunteerId: string | number;
  volunteerName: string;
  eventId: string | number;
  eventName: string;
  sharedSkills: string[];
  date?: string;
  matchScore?: number;
};

export default function MatchPage() {
  const [matches, setMatches] = useState<MatchSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/match/all");
        const suggestions: MatchSuggestion[] = (res.data || []).map(
          (entry: any) => ({
            ...entry,
            matchScore: Array.isArray(entry.sharedSkills)
              ? entry.sharedSkills.length
              : undefined,
          })
        );
        setMatches(suggestions);
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const handleAssign = async (match: MatchSuggestion) => {
    try {
      await axios.post("http://localhost:3001/api/history", {
        userId: match.volunteerId, // ✅ use correct field name for backend
        eventId: match.eventId,
        activityType: "Assigned",
        details: `Volunteer ${match.volunteerName || "Unknown"} assigned to ${
          match.eventName || "Unnamed Event"
        }`,
      });

      await axios.post("http://localhost:3001/api/notifications", {
        userId: match.volunteerId,
        eventId: match.eventId,
        message: `You’ve been assigned to ${match.eventName}`,
      });

      setToast(
        `✅ Assigned ${match.volunteerName || "volunteer"} to ${
          match.eventName
        }`
      );
    } catch (err: any) {
      console.error("❌ Error assigning volunteer:", err.response?.data || err);
      setToast("❌ Failed to assign volunteer.");
    }

    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      {toast && (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-green-700">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">Volunteer Matching</h1>
      <p className="text-sm mb-6">
        Below are system-suggested matches based on volunteer profiles and event
        requirements.
      </p>
      <h2 className="text-lg font-semibold mb-3">Suggested Matches</h2>

      {loading ? (
        <p className="text-gray-500">Loading match suggestions…</p>
      ) : matches.length === 0 ? (
        <p className="text-gray-500">No matches available.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 bg-white text-black">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Volunteer Name</th>
              <th className="border p-2 text-left">Matched Event</th>
              <th className="border p-2 text-left">Shared Skills</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Match Score</th>
              <th className="border p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr
                key={`${m.volunteerId}-${m.eventId}`}
                className="hover:bg-gray-50"
              >
                <td className="border p-2">{m.volunteerName}</td>
                <td className="border p-2">{m.eventName}</td>
                <td className="border p-2">
                  {m.sharedSkills && m.sharedSkills.length > 0
                    ? m.sharedSkills.join(", ")
                    : "None"}
                </td>
                <td className="border p-2">{m.date || "—"}</td>
                <td className="border p-2">
                  {typeof m.matchScore === "number" ? m.matchScore : "—"}
                </td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => handleAssign(m)}
                    className="rounded bg-blue-600 hover:bg-blue-700 text-white px-3 py-1"
                  >
                    Assign
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
