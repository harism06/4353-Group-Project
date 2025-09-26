import { useMemo, useState } from "react";
import Select from "react-select";
import { useAuth } from "@/features/auth/authContext";
import {
  eventsData,
  volunteers,
  scoreMatch,
  getUserMatches,
  saveUserMatches,
  type EventItem,
  type Volunteer,
  type MatchRecord,
} from "@/mock/data";

type Option = { value: string; label: string };

export default function MatchPage() {
  const { user } = useAuth();
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>(user?.id || "");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);

  const volunteerOptions: Option[] = useMemo(
    () =>
      volunteers.map((v) => ({ value: v.id, label: `${v.name}` })),
    []
  );

  const eventOptions: Option[] = useMemo(
    () => eventsData.map((e) => ({ value: e.id, label: `${e.name}` })),
    []
  );

  const selectedVolunteer: Volunteer | undefined = useMemo(
    () => volunteers.find((v) => v.id === selectedVolunteerId),
    [selectedVolunteerId]
  );
  const selectedEvent: EventItem | undefined = useMemo(
    () => eventsData.find((e) => e.id === selectedEventId),
    [selectedEventId]
  );

  const sortedMatches = useMemo(() => {
    if (!selectedVolunteer) return [] as EventItem[];
    return [...eventsData]
      .map((e) => ({ e, s: scoreMatch(selectedVolunteer, e) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.e);
  }, [selectedVolunteer]);

  const onCreateMatch = () => {
    if (!user || !selectedVolunteer || !selectedEvent) {
      setToast("Select volunteer and event first.");
      return;
    }
    const existing = getUserMatches(user.id);
    const rec: MatchRecord = {
      id: `m_${Date.now()}`,
      volunteerId: selectedVolunteer.id,
      eventId: selectedEvent.id,
      status: "Matched",
      createdAt: new Date().toISOString(),
    };
    saveUserMatches(user.id, [rec, ...existing]);
    setToast("Match created");
    setTimeout(() => setToast(null), 1800);
  };

  const makeBadge = (text: string) => (
    <span className="inline-block rounded bg-zinc-800 text-zinc-200 px-2 py-0.5 text-xs">
      {text}
    </span>
  );

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: "#ffffff",
      color: "#000000",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#000000",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "#ffffff",
      color: "#000000",
    }),
    option: (base: any, { isFocused, isSelected }: any) => ({
      ...base,
      backgroundColor: isSelected ? "#2563eb" : isFocused ? "#e5e7eb" : "#ffffff",
      color: "#000000",
    }),
  } as const;

  return (
    <div className="mx-auto max-w-3xl p-6">
      {toast && (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-green-700" aria-live="polite">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-2">Volunteer Matching</h1>
      <p className="text-sm mb-6">Pick a volunteer and event. Suggestions are ranked below.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm">Volunteer</span>
          <Select
            className="mt-1"
            styles={selectStyles}
            options={volunteerOptions}
            value={
              selectedVolunteerId
                ? volunteerOptions.find((o) => o.value === selectedVolunteerId) || null
                : null
            }
            onChange={(o) => setSelectedVolunteerId(o ? (o as Option).value : "")}
          />
        </label>

        <label className="block">
          <span className="text-sm">Event</span>
          <Select
            className="mt-1"
            styles={selectStyles}
            options={eventOptions}
            value={
              selectedEventId ? eventOptions.find((o) => o.value === selectedEventId) || null : null
            }
            onChange={(o) => setSelectedEventId(o ? (o as Option).value : "")}
          />
        </label>
      </div>

      <div className="mt-4">
        <label className="block">
          <span className="text-sm">Note (optional)</span>
          <input
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
        {!selectedVolunteer && (
          <p className="text-sm text-zinc-500">Select a volunteer to see suggestions.</p>
        )}
        {selectedVolunteer && (
          <ul className="space-y-3">
            {sortedMatches.map((ev) => (
              <li key={ev.id} className="p-4 border rounded-lg bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-lg text-black">{ev.name}</p>
                    <p className="text-gray-700">{ev.description}</p>
                    <p className="text-gray-700">📍 {ev.location}</p>
                    <p className="text-gray-700">📅 {ev.date}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {ev.requiredSkills.map((s) => (
                        <span key={s}>{makeBadge(s)}</span>
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


