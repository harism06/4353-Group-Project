// web/src/features/matching/MatchPage.tsx
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import api from "@/lib/axios";
import { isAdmin } from "@/app/role";
import { useAuth } from "@/features/auth/authContext";

type Option = { value: string; label: string };

export default function MatchPage() {
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>(
    user?.id || ""
  );
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [suggestedEvents, setSuggestedEvents] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [volRes, eventRes] = await Promise.all([
          api.get("/users"),
          api.get("/events"),
        ]);
        setVolunteers(
          (volRes.data ?? []).map((v: any) => ({ ...v, id: String(v.id) }))
        );
        setEvents(
          (eventRes.data ?? []).map((e: any) => ({ ...e, id: String(e.id) }))
        );
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedVolunteerId || !selectedEventId) return;
    (async () => {
      try {
        // If your backend has a suggestions endpoint, call it; otherwise set empty
        const { data } = await api.get(`/match/${selectedEventId}`);
        setSuggestedEvents(Array.isArray(data) ? data : []);
      } catch {
        setSuggestedEvents([]);
      }
    })();
  }, [selectedVolunteerId, selectedEventId]);

  const volunteerOptions: Option[] = useMemo(
    () =>
      volunteers.map((v) => ({
        value: v.id,
        label: v.email || v.name || v.id,
      })),
    [volunteers]
  );
  const eventOptions: Option[] = useMemo(
    () => events.map((e) => ({ value: e.id, label: e.name })),
    [events]
  );

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId),
    [events, selectedEventId]
  );

  const onCreateMatch = async () => {
    if (!selectedVolunteerId || !selectedEvent) {
      setToast("Select volunteer and event first.");
      setTimeout(() => setToast(null), 1500);
      return;
    }
    try {
      // Create a history entry; typically an admin action
      await api.post("/history", {
        volunteerId: selectedVolunteerId,
        eventId: selectedEvent.id,
        status: "Matched",
        note,
      });
      setToast("Match created successfully!");
    } catch (err) {
      console.error("Error creating match:", err);
      setToast("Failed to create match.");
    } finally {
      setTimeout(() => setToast(null), 1500);
    }
  };

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: "#ffffff",
      color: "#000000",
    }),
    singleValue: (base: any) => ({ ...base, color: "#000000" }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "#ffffff",
      color: "#000000",
    }),
  } as const;

  return (
    <div className="mx-auto max-w-3xl p-6">
      {toast && (
        <div
          className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-green-700"
          aria-live="polite"
        >
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-2">Volunteer Matching</h1>
      <p className="text-sm mb-6">
        Pick a volunteer and event. Suggestions are ranked below.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block" htmlFor="volunteerSelect">
          <span className="text-sm">Volunteer</span>
          <Select
            inputId="volunteerSelect"
            className="mt-1"
            styles={selectStyles}
            options={volunteerOptions}
            value={
              selectedVolunteerId
                ? volunteerOptions.find(
                    (o) => o.value === selectedVolunteerId
                  ) || null
                : null
            }
            onChange={(o) =>
              setSelectedVolunteerId(o ? (o as Option).value : "")
            }
          />
        </label>

        <label className="block" htmlFor="eventSelect">
          <span className="text-sm">Event</span>
          <Select
            inputId="eventSelect"
            className="mt-1"
            styles={selectStyles}
            options={eventOptions}
            value={
              selectedEventId
                ? eventOptions.find((o) => o.value === selectedEventId) || null
                : null
            }
            onChange={(o) => setSelectedEventId(o ? (o as Option).value : "")}
          />
        </label>
      </div>

      <div className="mt-4">
        <label className="block" htmlFor="noteInput">
          <span className="text-sm">Note (optional)</span>
          <input
            id="noteInput"
            className="mt-1 w-full rounded-md border p-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any details for this match"
          />
        </label>
      </div>

      <div className="mt-4">
        <button
          onClick={onCreateMatch}
          className="rounded-md bg-black text-white px-4 py-2"
        >
          Create Match
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Suggested Events</h2>
        {suggestedEvents.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No strong matches found based on skills.
          </p>
        ) : (
          <ul className="space-y-3">
            {suggestedEvents.map((ev) => (
              <li key={ev.id} className="p-4 border rounded-lg bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-lg text-black">{ev.name}</p>
                    <p className="text-gray-700">{ev.description}</p>
                    <p className="text-gray-700">📍 {ev.location}</p>
                    <p className="text-gray-700">📅 {ev.date}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(ev.requiredSkills ?? []).map((s: string) => (
                        <span
                          key={s}
                          className="inline-block rounded bg-zinc-800 text-zinc-200 px-2 py-0.5 text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEventId(ev.id)}
                    className="h-9 px-3 rounded bg-blue-600 text-white"
                  >
                    Select
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
