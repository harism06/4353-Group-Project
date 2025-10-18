import { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";

interface Event {
  id: number | string;
  name: string;
  description: string;
  location: string;
  requiredSkills: string[];
  urgency: string;
  date: string;
}

const skillOptions = [
  { value: "Event Planning", label: "Event Planning" },
  { value: "Marketing", label: "Marketing" },
  { value: "Photography", label: "Photography" },
  { value: "Food Service", label: "Food Service" },
  { value: "Customer Service", label: "Customer Service" },
  { value: "First Aid", label: "First Aid" },
  { value: "Teaching", label: "Teaching" },
  { value: "Translation", label: "Translation" },
  { value: "Technology Support", label: "Technology Support" },
  { value: "Fundraising", label: "Fundraising" },
  { value: "Social Media", label: "Social Media" },
  { value: "Administrative", label: "Administrative" },
  { value: "Cooking", label: "Cooking" },
  { value: "Driving", label: "Driving" },
  { value: "Organization", label: "Organization" },
];

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState<Omit<Event, "id">>({
    name: "",
    description: "",
    location: "",
    requiredSkills: [],
    urgency: "",
    date: "",
  });
  const [editId, setEditId] = useState<number | string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/events");
      const normalized = res.data.map((e: any) => ({
        ...e,
        requiredSkills: Array.isArray(e.requiredSkills) ? e.requiredSkills : [],
      }));
      setEvents(normalized);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillsChange = (selected: any) => {
    setForm((prev) => ({
      ...prev,
      requiredSkills: selected ? selected.map((s: any) => s.value) : [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.requiredSkills.length === 0) {
      alert("Please select at least one required skill.");
      return;
    }
    try {
      if (editId !== null) {
        setEvents(
          events.map((ev) => (ev.id === editId ? { ...form, id: editId } : ev))
        );
        setEditId(null);
      } else {
        await axios.post("http://localhost:3001/api/events", form);
        await fetchEvents();
      }
      setForm({
        name: "",
        description: "",
        location: "",
        requiredSkills: [],
        urgency: "",
        date: "",
      });
    } catch (err: any) {
      console.error("Error saving event:", err.response?.data || err.message);
      alert("Failed to save event. Check backend console for details.");
    }
  };

  const handleDelete = (id: number | string) => {
    setEvents(events.filter((ev) => ev.id !== id));
  };

  const handleEdit = (event: Event) => {
    setForm({ ...event });
    setEditId(event.id);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
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
            placeholder="Select required skills"
            className="mt-1"
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "#ffffff",
                color: "#000000",
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "#ffffff",
                color: "#000000",
              }),
            }}
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
            <option value="">Select urgency</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>
        <label className="block">
          <span className="font-medium">
            Event Date (required) <span className="text-xs font-normal text-gray-300">Calendar picker</span>
          </span>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded mt-1 bg-white text-black cursor-pointer"
            placeholder="Select a date"
          />
        </label>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          {editId !== null ? "Update Event" : "Add Event"}
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
