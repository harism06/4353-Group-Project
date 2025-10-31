import "dotenv/config";

// Provide an in-memory Prisma substitute during tests to avoid ESM/client issues
const isTest = process.env.NODE_ENV === "test" || typeof process.env.JEST_WORKER_ID !== "undefined";

let prisma;

if (isTest) {
  const users = [];
  const profiles = [];
  const events = [];

  const pick = (obj, select) => {
    if (!select) return obj;
    const out = {};
    for (const key of Object.keys(select)) {
      if (select[key]) out[key] = obj[key];
    }
    return out;
  };

  const genId = () => `${Date.now().toString(36)}_${Math.random().toString(16).slice(2)}`;

  prisma = {
    userCredentials: {
      async findFirst({ where, select } = {}) {
        const ors = where?.OR ?? [];
        const found = users.find((u) => ors.some((c) => u.email === c.email || u.username === c.username));
        return found ? pick(found, select) : null;
      },
      async findUnique({ where, select } = {}) {
        let found = null;
        if (where?.id) found = users.find((u) => u.id === where.id) || null;
        else if (where?.email) found = users.find((u) => u.email === where.email) || null;
        else if (where?.username) found = users.find((u) => u.username === where.username) || null;
        return found ? pick(found, select) : null;
      },
      async create({ data, select } = {}) {
        const record = {
          id: genId(),
          username: data.username,
          email: data.email,
          password: data.password,
          role: data.role ?? "volunteer",
        };
        users.push(record);
        return pick(record, select);
      },
      async deleteMany() {
        users.length = 0;
        return { count: 0 };
      },
    },
    userProfile: {
      async findUnique({ where } = {}) {
        return profiles.find((p) => p.userId === where?.userId) || null;
      },
      async create({ data }) {
        const record = { id: genId(), createdAt: new Date().toISOString(), ...data };
        profiles.push(record);
        return record;
      },
      async update({ where, data }) {
        const idx = profiles.findIndex((p) => p.userId === where?.userId);
        if (idx === -1) {
          const err = new Error("Not found");
          err.code = "P2025";
          throw err;
        }
        profiles[idx] = { ...profiles[idx], ...data };
        return profiles[idx];
      },
      async deleteMany() {
        profiles.length = 0;
        return { count: 0 };
      },
    },
    eventDetails: {
      async findMany({ orderBy } = {}) {
        const list = [...events];
        if (orderBy?.eventDate) {
          list.sort((a, b) =>
            orderBy.eventDate === "asc"
              ? a.eventDate - b.eventDate
              : b.eventDate - a.eventDate
          );
        }
        return list.map((e) => ({ ...e }));
      },
      async findUnique({ where } = {}) {
        if (!where?.id) return null;
        const found = events.find((e) => e.id === where.id);
        return found ? { ...found } : null;
      },
      async create({ data } = {}) {
        const now = new Date();
        const record = {
          id: genId(),
          name: data.name,
          description: data.description,
          location: data.location,
          skills: Array.isArray(data.skills) ? data.skills : data.skills ?? [],
          urgency: data.urgency,
          eventDate: data.eventDate instanceof Date ? data.eventDate : new Date(data.eventDate),
          createdAt: now,
          updatedAt: now,
        };
        events.push(record);
        return { ...record };
      },
      async update({ where, data } = {}) {
        const idx = events.findIndex((e) => e.id === where?.id);
        if (idx === -1) {
          const err = new Error("Not found");
          err.code = "P2025";
          throw err;
        }
        events[idx] = {
          ...events[idx],
          name: data.name ?? events[idx].name,
          description: data.description ?? events[idx].description,
          location: data.location ?? events[idx].location,
          skills: data.skills ?? events[idx].skills,
          urgency: data.urgency ?? events[idx].urgency,
          eventDate:
            data.eventDate instanceof Date
              ? data.eventDate
              : data.eventDate
              ? new Date(data.eventDate)
              : events[idx].eventDate,
          updatedAt: new Date(),
        };
        return { ...events[idx] };
      },
      async delete({ where } = {}) {
        const idx = events.findIndex((e) => e.id === where?.id);
        if (idx === -1) {
          const err = new Error("Not found");
          err.code = "P2025";
          throw err;
        }
        const [removed] = events.splice(idx, 1);
        return { ...removed };
      },
      async deleteMany({ where } = {}) {
        if (where?.name?.startsWith) {
          const start = where.name.startsWith;
          const keep = events.filter((e) => !String(e.name).startsWith(start));
          const count = events.length - keep.length;
          events.splice(0, events.length, ...keep);
          return { count };
        }
        const count = events.length;
        events.length = 0;
        return { count };
      },
    },
    async $disconnect() {},
  };
} else {
  const { PrismaClient } = await import("@prisma/client");
  prisma = new PrismaClient();
}

export default prisma;
