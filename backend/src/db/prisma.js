import "dotenv/config";

// Provide an in-memory Prisma substitute during tests to avoid ESM/client issues
const isTest = process.env.NODE_ENV === "test" || typeof process.env.JEST_WORKER_ID !== "undefined";

let prisma;

if (isTest) {
  const users = [];
  const profiles = [];

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
    async $disconnect() {},
  };
} else {
  const { PrismaClient } = await import("@prisma/client");
  prisma = new PrismaClient();
}

export default prisma;
