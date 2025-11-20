import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import axios from "axios";
import { useAuth } from "@/features/auth/authContext";

type Option = { value: string; label: string };

export default function MatchPage() {
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [matchedEvents, setMatchedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [volRes, eventRes] = await Promise.all([
          axios.get("http://localhost:3001/api/users"),
          axios.get("http://localhost:3001/api/events"),
        ]);

        const normalizedEvents = eventRes.data.map((e: any) => ({
          ...e,
          id: String(e.id),
        }));

        const normalizedVolunteers = volRes.data.map((v: any) => ({
          ...v,
          id: String(v.id),
        }));

        setVolunteers(normalizedVolunteers);
        setEvents(normalizedEvents);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // Fetch matched events when volunteer is selected
  useEffect(() => {
    if (!selectedVolunteerId) {
      setMatchedEvents(new Set());
      return;
    }

    const fetchMatchedEvents = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/history/${selectedVolunteerId}`);
        const matchedSet = new Set<string>();
        response.data.forEach((record: any) => {
          if (record.activityType === "Matched" || 
              record.activityType?.includes("Matched") ||
              record.activityType === "Confirmed" ||
              record.activityType?.includes("Confirmed")) {
            matchedSet.add(String(record.eventId));
          }
        });
        setMatchedEvents(matchedSet);
      } catch (err) {
        console.error("Error fetching matched events:", err);
      }
    };

    fetchMatchedEvents();
  }, [selectedVolunteerId]);

  const volunteerOptions: Option[] = useMemo(
    () =>
      volunteers.map((v) => ({
        value: v.id,
        label: `${v.fullName} (${v.skills?.join(", ") || "No skills"})`,
      })),
    [volunteers]
  );

  const selectedVolunteer = useMemo(
    () => volunteers.find((v) => String(v.id) === selectedVolunteerId),
    [selectedVolunteerId, volunteers]
  );

  const eventMatches = useMemo(() => {
    if (!selectedVolunteer || !selectedVolunteer.skills) return [];
    
    return events.map((event) => {
      const volunteerSkills = selectedVolunteer.skills || [];
      const requiredSkills = event.requiredSkills || [];
      const matchingSkills = volunteerSkills.filter((skill: string) =>
        requiredSkills.includes(skill)
      );
      const matchScore = matchingSkills.length;
      const matchPercentage = requiredSkills.length > 0 
        ? Math.round((matchScore / requiredSkills.length) * 100) 
        : 0;
      const missingSkills = requiredSkills.filter(
        (skill: string) => !volunteerSkills.includes(skill)
      );
      
      return {
        ...event,
        matchScore,
        matchPercentage,
        matchingSkills,
        missingSkills,
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [selectedVolunteer, events]);

  const onCreateMatch = async (eventId: string) => {
    if (!selectedVolunteerId) {
      setToast("Select volunteer first.");
      return;
    }

    const selectedEvent = events.find((e) => e.id === eventId);
    if (!selectedEvent) return;

    try {
      await axios.post("http://localhost:3001/api/history", {
        userId: String(selectedVolunteerId),
        eventId: String(selectedEvent.id),
        activityType: "Matched",
        details: note || undefined,
      });

      await axios.post("http://localhost:3001/api/notifications", {
        userId: String(selectedVolunteerId),
        message: `You've been matched to ${selectedEvent.name}`,
      });

      setMatchedEvents((prev) => new Set(prev).add(eventId));
      setToast("Volunteer matched successfully!");
      setNote("");
    } catch (err) {
      console.error("Error creating match:", err);
      setToast("Failed to create match.");
    }

    setTimeout(() => setToast(null), 3000);
  };

  const onUnmatch = async (eventId: string) => {
    if (!selectedVolunteerId) return;

    const selectedEvent = events.find((e) => e.id === eventId);
    if (!selectedEvent) return;

    try {
      await axios.delete("http://localhost:3001/api/history", {
        params: {
          userId: String(selectedVolunteerId),
          eventId: String(selectedEvent.id),
        },
      });

      setMatchedEvents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
      setToast("Volunteer unmatched successfully!");
    } catch (err) {
      console.error("Error unmatching:", err);
      setToast("Failed to unmatch volunteer.");
    }

    setTimeout(() => setToast(null), 3000);
  };

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: "#27272a",
      borderColor: "#3f3f46",
      color: "#ffffff",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#ffffff",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "#27272a",
      color: "#ffffff",
    }),
    option: (base: any, { isFocused, isSelected }: any) => ({
      ...base,
      backgroundColor: isSelected
        ? "#2563eb"
        : isFocused
        ? "#3f3f46"
        : "#27272a",
      color: "#ffffff",
    }),
  } as const;

  return (
    <div className="mx-auto max-w-6xl p-6">
      {toast && (
        <div
          className="mb-4 rounded-md border border-green-500 bg-green-500/20 p-3 text-green-400"
          aria-live="polite"
        >
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Smart Volunteer Matching</h1>
        <p className="text-zinc-400">
          Select a volunteer to see intelligent event matches based on skills, location, and availability.
        </p>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-zinc-200">
          Select Volunteer
        </label>
        <Select
          styles={selectStyles}
          options={volunteerOptions}
          value={
            selectedVolunteerId
              ? volunteerOptions.find((o) => o.value === selectedVolunteerId) || null
              : null
          }
          onChange={(o) => setSelectedVolunteerId(o ? (o as Option).value : "")}
          placeholder="Choose a volunteer..."
        />
      </div>

      {selectedVolunteer && (
        <div className="mb-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
          <h2 className="text-lg font-semibold mb-3 text-zinc-200">Volunteer Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-400">Name:</span>
              <span className="ml-2 text-zinc-200">{selectedVolunteer.fullName}</span>
            </div>
            <div>
              <span className="text-zinc-400">Location:</span>
              <span className="ml-2 text-zinc-200">
                {selectedVolunteer.city}, {selectedVolunteer.state}
              </span>
            </div>
            <div>
              <span className="text-zinc-400">Skills:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {selectedVolunteer.skills?.map((skill: string) => (
                  <span
                    key={skill}
                    className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            {selectedVolunteer.preferences && (
              <div>
                <span className="text-zinc-400">Preferences:</span>
                <span className="ml-2 text-zinc-200">{selectedVolunteer.preferences}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedVolunteer && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-zinc-200">
            Recommended Events ({eventMatches.length})
          </h2>
          <div className="space-y-4">
            {eventMatches.map((event) => {
              const isPerfectMatch = event.matchPercentage === 100;
              const isGoodMatch = event.matchPercentage >= 50;
              
              return (
                <div
                  key={event.id}
                  className={`p-5 rounded-lg border ${
                    isPerfectMatch
                      ? "bg-green-600/10 border-green-600/50"
                      : isGoodMatch
                      ? "bg-blue-600/10 border-blue-600/50"
                      : "bg-zinc-800 border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-zinc-200">{event.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isPerfectMatch
                              ? "bg-green-600 text-white"
                              : isGoodMatch
                              ? "bg-blue-600 text-white"
                              : "bg-zinc-600 text-zinc-300"
                          }`}
                        >
                          {event.matchPercentage}% Match
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            event.urgency === "High"
                              ? "bg-red-600/20 text-red-400"
                              : event.urgency === "Medium"
                              ? "bg-yellow-600/20 text-yellow-400"
                              : "bg-zinc-600/20 text-zinc-400"
                          }`}
                        >
                          {event.urgency} Priority
                        </span>
                      </div>
                      <p className="text-zinc-300 mb-2">{event.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-zinc-400 mb-3">
                        <span>📍 {event.location}</span>
                        <span>📅 {event.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Matching Skills ({event.matchingSkills.length}/{event.requiredSkills.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {event.matchingSkills.map((skill: string) => (
                          <span
                            key={skill}
                            className="px-2 py-1 rounded bg-green-600/20 text-green-400 text-xs"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    {event.missingSkills.length > 0 && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-1">Missing Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {event.missingSkills.map((skill: string) => (
                            <span
                              key={skill}
                              className="px-2 py-1 rounded bg-zinc-700 text-zinc-400 text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {matchedEvents.has(event.id) ? (
                      <button
                        onClick={() => onUnmatch(event.id)}
                        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition font-medium"
                      >
                        Unmatch Volunteer
                      </button>
                    ) : (
                      <button
                        onClick={() => onCreateMatch(event.id)}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
                      >
                        Match Volunteer
                      </button>
                    )}
                    {matchedEvents.has(event.id) && (
                      <span className="text-sm text-green-400">✓ Matched</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!selectedVolunteer && (
        <div className="text-center py-12 bg-zinc-800 rounded-lg border border-zinc-700">
          <p className="text-zinc-400 text-lg">
            Select a volunteer above to see intelligent event matches
          </p>
        </div>
      )}
    </div>
  );
}
