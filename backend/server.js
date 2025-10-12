const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const eventRoutes = require("./routes/events");
const notificationRoutes = require("./routes/notifications");
const historyRoutes = require("./routes/history");
const matchRoutes = require("./routes/match");
const app = express();
app.use(cors());
app.use(express.json());
app.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/match", matchRoutes);
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== "test") {
  /* istanbul ignore next */
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
module.exports = app;
