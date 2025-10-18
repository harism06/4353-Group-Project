import { useEffect, useState } from "react";
import Select from "react-select";
import api from "@/lib/axios";
import { isAdmin } from "@/app/role";

type Event = {
  id: string;
  name: string;
  description: string;
  location: string;
  requiredSkills: string[];
  urgency: "Low" | "Medium" | "High";
  date: string; // UI value yyyy-mm-dd
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

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState<Omit<Event, "id">>({
    name: "",
    description: "",
    location: "",
    requiredSkills: [],
    urgency: "Low",
    date: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const { data } = await api.get("/events");
      setEvents(
        (data ?? []).map((e: any) => ({
          ...e,
          id: String(e.id),
          requiredSkills: Array.isArray(e.requiredSkills)
            ? e.requiredSkills
            : [],
        }))
      );
    } catch (err) {
      console.error("Error fetching events:", err);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin()) {
      setToast("Only admins can create events.");
      return;
    }

    try {
      if (editId) {
        // If you add a backend PUT later, replace local update with API call.
        setEvents((list) =>
          list.map((ev) =>
            ev.id === editId ? ({ ...form, id: editId } as Event) : ev
          )
        );
        setEditId(null);
      } else {
        const eventDate =
          form.date.length <= 10
            ? new Date(form.date + "T00:00:00").toISOString()
            : form.date;

        await api.post("/events", {
          name: form.name,
          description: form.description,
          location: form.location,
          requiredSkills: form.requiredSkills,
          urgency: form.urgency,
          eventDate, // backend field
        });
        await fetchEvents();
      }

      setForm({
        name: "",
        description: "",
        location: "",
        requiredSkills: [],
        urgency: "Low",
        date: "",
      });
      setToast("Saved!");
      setTimeout(() => setToast(null), 1200);
    } catch (err: any) {
      console.error("Error saving event:", err?.response?.data || err.message);
      setToast("Failed to save event.");
      setTimeout(() => setToast(null), 1500);
    }
  }

  function handleDelete(id: string) {
    setEvents((list) => list.filter((ev) => ev.id !== id));
  }

  function handleEdit(event: Event) {
    setForm({ ...event });
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
          <textarea
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded mt-1 bg-white text-black"
            placeholder="Enter event location"
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
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
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

      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-3">Event List</h3>
        {events.length === 0 ? (
          <p className="text-gray-500">No events created yet.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="p-4 border rounded-lg shadow-sm flex justify-between items-start bg-white"
              >
                <div>
                  <p className="font-bold text-black">{event.name}</p>
                  <p className="text-gray-700">{event.description}</p>
                  <p className="text-gray-700">{event.location}</p>
                  <p className="text-gray-700">
                    Skills:{" "}
                    {Array.isArray(event.requiredSkills) &&
                    event.requiredSkills.length > 0
                      ? event.requiredSkills.join(", ")
                      : "None"}
                  </p>
                  <p className="text-gray-700">Urgency: {event.urgency}</p>
                  <p className="text-gray-700">Date: {event.date}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(event)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Delete
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
