import api from "@/lib/axios";

export type NewEventPayload = {
  name: string;
  description: string;
  location: string;
  requiredSkills: string[];
  urgency: "low" | "medium" | "high";
  eventDate: string; // ISO string
};

export async function createEvent(payload: NewEventPayload) {
  try {
    const { data } = await api.post("/events", payload);
    return data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      // some setups mount admin create here:
      const { data } = await api.post("/admin/events", payload);
      return data;
    }
    throw err;
  }
}

export async function getEvents() {
  const { data } = await api.get("/events");
  return data;
}
