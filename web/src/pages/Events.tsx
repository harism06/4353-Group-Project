import { useState } from "react";
import Select from "react-select";

interface Event {
  id: number;
  name: string;
  description: string;
  location: string;
  skills: string[];
  urgency: string;
  date: string;
}

const skillOptions = [
  { value: "Cooking", label: "Cooking" },
  { value: "Teaching", label: "Teaching" },
  { value: "Driving", label: "Driving" },
  { value: "Medical", label: "Medical" },
];

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState<Omit<Event, "id">>({
    name: "",
    description: "",
    location: "",
    skills: [],
    urgency: "",
    date: "",
  });
  const [editId, setEditId] = useState<number | null>(null);

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
      skills: selected ? selected.map((s: any) => s.value) : [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (form.skills.length === 0) {
      alert("Please select at least one required skill.");
      return;
    }

    if (editId !== null) {
      setEvents(
        events.map((ev) => (ev.id === editId ? { ...form, id: editId } : ev))
      );
      setEditId(null);
    } else {
      setEvents([...events, { ...form, id: Date.now() }]);
    }

    setForm({
      name: "",
      description: "",
      location: "",
      skills: [],
      urgency: "",
      date: "",
    });
  };

  const handleDelete = (id: number) => {
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

      {/* Event Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-black text-white shadow-md p-6 rounded-lg"
      >
        {/* Event Name */}
        <label className="block">
          <span className="font-medium">
            Event Name (100 characters, required)
          </span>
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

        {/* Event Description */}
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

        {/* Location */}
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

        {/* Required Skills */}
        <label className="block">
          <span className="font-medium">
            Required Skills (multi-select, required)
          </span>
          <Select
            isMulti
            options={skillOptions}
            value={skillOptions.filter((opt) =>
              form.skills.includes(opt.value)
            )}
            onChange={handleSkillsChange}
            placeholder="Select required skills"
            className="mt-1"
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "#ffffff", // white
                color: "#000000",
              }),
              singleValue: (base) => ({
                ...base,
                color: "#000000", // black text
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "#ffffff", // white dropdown
                color: "#000000",
              }),
              option: (base, { isFocused, isSelected }) => ({
                ...base,
                backgroundColor: isSelected
                  ? "#2563eb" // blue selected
                  : isFocused
                  ? "#e5e7eb" // gray-200 hover
                  : "#ffffff",
                color: "#000000",
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: "#2563eb", // blue chips
                color: "#ffffff",
              }),
              multiValueLabel: (base) => ({
                ...base,
                color: "#ffffff",
              }),
              multiValueRemove: (base) => ({
                ...base,
                color: "#ffffff",
                ":hover": {
                  backgroundColor: "#dc2626", // red-600
                  color: "#ffffff",
                },
              }),
            }}
          />
        </label>

        {/* Urgency */}
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

        {/* Event Date */}
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

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          {editId !== null ? "Update Event" : "Add Event"}
        </button>
      </form>

      {/* Event List */}
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
                  <p className="font-bold text-lg">{event.name}</p>
                  <p className="text-gray-700">{event.description}</p>
                  <p className="text-gray-700">📍 {event.location}</p>
                  <p className="text-gray-700">
                    🛠 Skills: {event.skills.join(", ")}
                  </p>
                  <p className="text-gray-700">⚡ Urgency: {event.urgency}</p>
                  <p className="text-gray-700">📅 Date: {event.date}</p>
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
