import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import auth from "./routes/auth.js";
import profile from "./routes/profile.js";
import usersRoutes from "./routes/users.js";
import events from "./routes/events.js";
import history from "./routes/history.js";
import notifications from "./routes/notifications.js";
import match from "./routes/match.js";

console.log("[DB]", process.env.DATABASE_URL);

const app = express();

app.use(
  cors({
    origin: process.env.WEB_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// mount (gives /api/auth/* etc.)
app.use("/api", auth);
app.use("/api", profile);
app.use("/api", usersRoutes);
app.use("/api", events);
app.use("/api", history);
app.use("/api", notifications);
app.use("/api", match);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

if (process.env.NODE_ENV !== "test" && !process.env.JEST_WORKER_ID) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`Backend running on :${port}`));
}

export default app;
