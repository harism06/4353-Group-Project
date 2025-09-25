// simple mock data for volunteers and events

export type Volunteer = {
  id: string;
  name: string;
  email?: string;
  skills: string[];
  availability: string[]; // ISO dates like "2025-09-30"
};

export type EventItem = {
  id: string;
  name: string;
  description: string;
  location: string;
  requiredSkills: string[];
  urgency: "Low" | "Medium" | "High";
  date: string; // ISO date string
};

export type MatchStatus = "Matched" | "Confirmed" | "Completed" | "No-show";

export type MatchRecord = {
  id: string;
  volunteerId: string;
  eventId: string;
  status: MatchStatus;
  createdAt: string;
};

export const volunteers: Volunteer[] = [
  {
    id: "u_1",
    name: "Test User",
    email: "test@example.com",
    skills: ["Cooking", "Customer Service", "Technology Support"],
    availability: generateUpcomingDates(7),
  },
  {
    id: "u_2",
    name: "Sample User",
    email: "sample@example.com",
    skills: ["Teaching", "Event Planning", "Marketing"],
    availability: generateUpcomingDates(7).filter((_, i) => i % 2 === 0),
  },
];

export const eventsData: EventItem[] = [
  {
    id: "e_1",
    name: "Community Kitchen",
    description: "Prepare and serve meals.",
    location: "Downtown Center",
    requiredSkills: ["Cooking", "Customer Service"],
    urgency: "High",
    date: offsetDate(1),
  },
  {
    id: "e_2",
    name: "After-School Tutoring",
    description: "Help students with homework.",
    location: "West Library",
    requiredSkills: ["Teaching"],
    urgency: "Medium",
    date: offsetDate(2),
  },
  {
    id: "e_3",
    name: "Social Media Drive",
    description: "Create posts for fundraiser.",
    location: "Remote",
    requiredSkills: ["Marketing", "Social Media"],
    urgency: "Low",
    date: offsetDate(3),
  },
  {
    id: "e_4",
    name: "Device Setup Day",
    description: "Basic tech setup for seniors.",
    location: "Community Hall",
    requiredSkills: ["Technology Support", "Customer Service"],
    urgency: "Medium",
    date: offsetDate(4),
  },
  {
    id: "e_5",
    name: "Food Bank Sorting",
    description: "Sort and pack donations.",
    location: "East Warehouse",
    requiredSkills: ["Administrative", "Customer Service"],
    urgency: "Low",
    date: offsetDate(5),
  },
];

export function offsetDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

export function generateUpcomingDates(days: number): string[] {
  return Array.from({ length: days }, (_, i) => offsetDate(i + 1));
}

export function scoreMatch(volunteer: Volunteer, event: EventItem): number {
  const overlap = volunteer.skills.filter((s) => event.requiredSkills.includes(s)).length;
  const hasDate = volunteer.availability.includes(event.date) ? 1 : 0;
  return overlap + hasDate;
}

export function getUserMatches(userId: string): MatchRecord[] {
  const raw = localStorage.getItem(`matches:${userId}`);
  return raw ? (JSON.parse(raw) as MatchRecord[]) : [];
}

export function saveUserMatches(userId: string, data: MatchRecord[]) {
  localStorage.setItem(`matches:${userId}`, JSON.stringify(data));
}


