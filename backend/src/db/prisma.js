import "dotenv/config";

// Provide an in-memory Prisma substitute during tests to avoid ESM/client issues
const isTest = process.env.NODE_ENV === "test" || typeof process.env.JEST_WORKER_ID !== "undefined";

let prisma;

if (isTest) {
  const users = [];
  const profiles = [];
  const events = [];
  const assignments = [];

  const pick = (obj, select) => {
    if (!select) return obj;
    const out = {};
    for (const key of Object.keys(select)) {
      if (select[key]) out[key] = obj[key];
    }
    return out;
  };

  const genId = () => `${Date.now().toString(36)}_${Math.random().toString(16).slice(2)}`;

  const matchScalar = (value, condition) => {
    if (!condition && condition !== 0) return true;
    if (typeof condition === "object") {
      if (Array.isArray(condition.in)) {
        return condition.in.includes(value);
      }
      if (condition.equals !== undefined) {
        return value === condition.equals;
      }
      if (condition.startsWith) {
        return String(value).startsWith(condition.startsWith);
      }
    }
    return value === condition;
  };

  const matchDate = (value, condition) => {
    if (!condition) return true;
    const dateValue = value instanceof Date ? value : new Date(value);
    if (condition.gte && dateValue < new Date(condition.gte)) return false;
    if (condition.lte && dateValue > new Date(condition.lte)) return false;
    return true;
  };

  const cloneProfile = (userId) => {
    const profile = profiles.find((p) => p.userId === userId);
    return profile ? { ...profile } : null;
  };

  const withAssignmentRelations = (assignment, include) => {
    const row = { ...assignment };
    if (include?.event) {
      row.event = events.find((e) => e.id === assignment.eventId) || null;
    }
    if (include?.volunteer) {
      const volunteer = users.find((u) => u.id === assignment.volunteerId);
      if (volunteer) {
        const base =
          include.volunteer.select && Object.keys(include.volunteer.select).length
            ? pick(volunteer, include.volunteer.select)
            : { ...volunteer };
        if (include.volunteer.include?.profile) {
          base.profile = cloneProfile(volunteer.id);
        }
        row.volunteer = base;
      } else {
        row.volunteer = null;
      }
    }
    return row;
  };

  prisma = {
    userCredentials: {
      async findFirst({ where, select } = {}) {
        const ors = where?.OR ?? [];
        const found = users.find((u) =>
          ors.some((c) => u.email === c.email || u.username === c.username)
        );
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
      async findMany({ where, include, select } = {}) {
        let list = [...users];
        if (where?.id) list = list.filter((u) => matchScalar(u.id, where.id));
        if (where?.email) list = list.filter((u) => matchScalar(u.email, where.email));
        if (where?.role) list = list.filter((u) => matchScalar(u.role, where.role));
        return list.map((user) => {
          const base = select ? pick(user, select) : { ...user };
          if (include?.profile) {
            base.profile = cloneProfile(user.id);
          }
          return base;
        });
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
      async findMany({ where } = {}) {
        let list = [...profiles];
        if (where?.userId) {
          list = list.filter((p) => matchScalar(p.userId, where.userId));
        }
        return list.map((p) => ({ ...p }));
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
      async findMany({ where, orderBy } = {}) {
        let list = [...events];
        if (where?.id) list = list.filter((e) => matchScalar(e.id, where.id));
        if (where?.eventDate) {
          list = list.filter((e) => matchDate(e.eventDate, where.eventDate));
        }
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
    volunteerAssignment: {
      async findMany({ where, include, orderBy } = {}) {
        let list = [...assignments];
        if (where?.id) list = list.filter((a) => matchScalar(a.id, where.id));
        if (where?.eventId) list = list.filter((a) => matchScalar(a.eventId, where.eventId));
        if (where?.volunteerId)
          list = list.filter((a) => matchScalar(a.volunteerId, where.volunteerId));
        if (where?.status) list = list.filter((a) => matchScalar(a.status, where.status));
        if (orderBy?.assignedAt) {
          list.sort((a, b) =>
            orderBy.assignedAt === "asc"
              ? a.assignedAt - b.assignedAt
              : b.assignedAt - a.assignedAt
          );
        }
        return list.map((assignment) => withAssignmentRelations(assignment, include ?? {}));
      },
      async create({ data, include } = {}) {
        const now = new Date();
        const record = {
          id: genId(),
          eventId: data.eventId,
          volunteerId: data.volunteerId,
          status: data.status ?? "pending",
          hours: typeof data.hours === "number" ? data.hours : 0,
          notes: data.notes ?? null,
          assignedAt: data.assignedAt ? new Date(data.assignedAt) : now,
          completedAt: data.completedAt ? new Date(data.completedAt) : null,
          updatedAt: now,
        };
        assignments.push(record);
        return include ? withAssignmentRelations(record, include) : { ...record };
      },
      async createMany({ data } = {}) {
        if (!Array.isArray(data)) return { count: 0 };
        data.forEach((entry) => {
          assignments.push({
            id: genId(),
            eventId: entry.eventId,
            volunteerId: entry.volunteerId,
            status: entry.status ?? "pending",
            hours: typeof entry.hours === "number" ? entry.hours : 0,
            notes: entry.notes ?? null,
            assignedAt: entry.assignedAt ? new Date(entry.assignedAt) : new Date(),
            completedAt: entry.completedAt ? new Date(entry.completedAt) : null,
            updatedAt: new Date(),
          });
        });
        return { count: data.length };
      },
      async deleteMany({ where } = {}) {
        if (!where) {
          const count = assignments.length;
          assignments.length = 0;
          return { count };
        }
        const keep = assignments.filter((a) => {
          if (where.eventId && matchScalar(a.eventId, where.eventId) === false) return true;
          if (where.volunteerId && matchScalar(a.volunteerId, where.volunteerId) === false)
            return true;
          if (where.id && matchScalar(a.id, where.id) === false) return true;
          return false;
        });
        const count = assignments.length - keep.length;
        assignments.splice(0, assignments.length, ...keep);
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
