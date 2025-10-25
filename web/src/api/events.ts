import api from "@/lib/axios";

export type EventRecord = {
  id: string;
  name: string;
  description: string;
  location: string;
  requiredSkills: string[];
  urgency: "low" | "medium" | "high";
  eventDate: string;
  createdAt: string;
  updatedAt: string;
};

export type EventPayload = {
  name: string;
  description: string;
  location: string;
  requiredSkills: string[];
  urgency: "low" | "medium" | "high";
  eventDate: string;
};

export async function listEvents() {
  const { data } = await api.get<EventRecord[]>("/events");
  return data;
}

export async function getEvent(id: string) {
  const { data } = await api.get<EventRecord>(`/events/${id}`);
  return data;
}

export async function createEvent(payload: EventPayload) {
  const { data } = await api.post<EventRecord>("/events", payload);
  return data;
}

export async function updateEvent(id: string, payload: EventPayload) {
  const { data } = await api.put<EventRecord>(`/events/${id}`, payload);
  return data;
}

export async function removeEvent(id: string) {
  await api.delete(`/events/${id}`);
}

export type MatchResult = {
  volunteerId: string;
  volunteerName: string;
  score: number;
  skillMatches: number;
  locationMatch: boolean;
  reason: string;
};

export async function getEventMatches(id: string) {
  const { data } = await api.get<MatchResult[]>(`/events/${id}/matches`);
  return data;
}
