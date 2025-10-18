import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

export const users = []; // {id,email,passwordHash,role}
export const profiles = []; // {userId, fullName, skills[], availability, ...}
export const events = []; // {id,name,description,requiredSkills[],urgency,eventDate,location}
export const history = []; // {id,userId,eventId,status,note,assignedAt}
export const notifications = []; // {id,userId,message,createdAt,read}

export async function seedMem() {
  if (users.length) return;

  const adminPwd = await bcrypt.hash("secret12", 10);
  const volPwd = await bcrypt.hash("secret12", 10);

  const admin = {
    id: randomUUID(),
    email: "admin@test.com",
    passwordHash: adminPwd,
    role: "admin",
  };
  const vol = {
    id: randomUUID(),
    email: "vol@test.com",
    passwordHash: volPwd,
    role: "volunteer",
  };
  users.push(admin, vol);

  profiles.push({
    userId: admin.id,
    fullName: "Admin User",
    city: "Houston",
    state: "TX",
    skills: ["Administration"],
    availability: "Weekdays",
  });

  profiles.push({
    userId: vol.id,
    fullName: "Sample Volunteer",
    city: "Houston",
    state: "TX",
    skills: ["Cooking", "Teaching"],
    availability: "Weekends",
  });

  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  const twoDays = new Date(Date.now() + 2 * 86400000).toISOString();

  events.push(
    {
      id: randomUUID(),
      name: "Community Kitchen",
      description: "Prepare & serve",
      requiredSkills: ["Cooking"],
      urgency: "high",
      eventDate: tomorrow,
      location: "Downtown",
    },
    {
      id: randomUUID(),
      name: "After-School Tutoring",
      description: "Help students",
      requiredSkills: ["Teaching"],
      urgency: "medium",
      eventDate: twoDays,
      location: "West Library",
    }
  );
}
