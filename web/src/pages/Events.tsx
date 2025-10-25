import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { isAdmin } from "@/app/role";
import {
  createEvent,
  listEvents,
  removeEvent,
  updateEvent,
  type EventRecord,
} from "@/api/events";

type FormState = {
  name: string;
  description: string;
  location: string;
  requiredSkills: string[];
  urgency: "low" | "medium" | "high";
  date: string;
};

const skillOptions = [
  "Event Planning",
  "Marketing",
  "Photography",
  "Food Service",
  "Customer Service",
  "First Aid",
  "Teaching",
  "Translation",
  "Technology Support",
  "Fundraising",
  "Social Media",
  "Administrative",
  "Cooking",
  "Driving",
  "Organization",
].map((v) => ({ value: v, label: v }));

const defaultForm: FormState = {
  name: "",
  description: "",
  location: "",
  requiredSkills: [],
  urgency: "low",
  date: "",
};

export default function Events() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      ),
    [events]
  );

  async function fetchEvents() {
    try {
      setLoading(true);
      setError(null);
      const data = await listEvents();
      setEvents(
        data.map((evt) => ({
          ...evt,
          requiredSkills: Array.isArray(evt.requiredSkills)
            ? evt.requiredSkills
            : [],
        }))
      );
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSkillsChange(selected: any) {
    setForm((prev) => ({
      ...prev,
      requiredSkills: selected ? selected.map((s: any) => s.value) : [],
    }));
  }

  function isoFromDateInput(value: string) {
    if (!value) return "";
    return new Date(value + "T00:00:00Z").toISOString();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin()) {
      setToast("Only admins can create or edit events.");
      return;
    }
    try {
      const payload = {
        name: form.name,
        description: form.description,
        location: form.location,
        requiredSkills: form.requiredSkills,
        urgency: form.urgency,
        eventDate: isoFromDateInput(form.date),
      };

      if (editId) {
        await updateEvent(editId, payload);
      } else {
        await createEvent(payload);
      }
      await fetchEvents();
      setForm(defaultForm);
      setEditId(null);
      setToast("Event saved!");
      setTimeout(() => setToast(null), 1200);
    } catch (err: any) {
      console.error("Error saving event:", err?.response?.data || err.message);
      setToast("Failed to save event.");
      setTimeout(() => setToast(null), 1500);
    }
  }

  async function handleDelete(id: string) {
    if (!isAdmin()) {
      setToast("Only admins can delete events.");
      return;
    }
    try {
      await removeEvent(id);
      await fetchEvents();
      setToast("Event removed");
      setTimeout(() => setToast(null), 1000);
    } catch (err) {
      console.error("Failed to delete event", err);
      setToast("Failed to delete event.");
      setTimeout(() => setToast(null), 1500);
    }
  }

  function handleEdit(event: EventRecord) {
    setForm({
      name: event.name,
      description: event.description,
      location: event.location,
      requiredSkills: event.requiredSkills ?? [],
      urgency: event.urgency,
      date: event.eventDate.slice(0, 10),
    });
    setEditId(event.id);
  }

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: "#ffffff",
      color: "#000000",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "#ffffff",
      color: "#000000",
    }),
  } as const;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {toast && (
        <div
          className="mb-4 rounded-md border border-blue-300 bg-blue-50 p-3 text-blue-700"
          aria-live="polite"
        >
          {toast}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-center">
        Event Management (Admin)
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-black text-white shadow-md p-6 rounded-lg"
      >
        <label className="block">
          <span className="font-medium">Event Name (required)</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            maxLength={100}
            className="w-full p-2 border rounded mt-1 bg-white text-black"
            placeholder="Enter event name"
          />
        </label>

        <label className="block">
          <span className="font-medium">Event Description (required)</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded mt-1 bg-white text-black"
            placeholder="Enter event description"
          />
        </label>

        <label className="block">
          <span className="font-medium">Location (required)</span>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded mt-1 bg-white text-black"
            placeholder="City / Venue"
          />
        </label>

        <label className="block">
          <span className="font-medium">
            Required Skills (multi-select, required)
          </span>
          <Select
            isMulti
            options={skillOptions}
            value={skillOptions.filter((opt) =>
              form.requiredSkills.includes(opt.value)
            )}
            onChange={handleSkillsChange}
            className="mt-1"
            styles={selectStyles}
          />
        </label>

        <label className="block">
          <span className="font-medium">Urgency (required)</span>
          <select
            name="urgency"
            value={form.urgency}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded mt-1 bg-white text-black"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className="block">
          <span className="font-medium">Event Date (required)</span>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded mt-1 bg-white text-black"
          />
        </label>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          {editId ? "Update Event" : "Add Event"}
        </button>
      </form>

      <section className="mt-8">
        {loading ? (
          <p className="text-center text-gray-500">Loading events...</p>
        ) : sortedEvents.length === 0 ? (
          <p className="text-center text-gray-500">No events created yet.</p>
        ) : (
          <ul className="space-y-4">
            {sortedEvents.map((event) => (
              <li
                key={event.id}
                className="border rounded-lg p-4 bg-white shadow flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">{event.name}</h3>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    {event.eventDate.slice(0, 10)}
                  </span>
                </div>

                <p className="text-sm">
                  <strong>Location:</strong> {event.location}
                </p>
                <p className="text-sm">
                  <strong>Required Skills:</strong>{" "}
                  {event.requiredSkills.length
                    ? event.requiredSkills.join(", ")
                    : "None specified"}
                </p>
                <p className="text-sm capitalize">
                  <strong>Urgency:</strong> {event.urgency}
                </p>

                {isAdmin() && (
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => handleEdit(event)}
                      className="flex-1 bg-black text-white py-2 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="flex-1 border border-red-500 text-red-500 py-2 rounded"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
