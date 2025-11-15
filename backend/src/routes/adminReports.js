import express from "express";
import { requireAdmin } from "../middleware/adminOnly.js";
import {
  getEventsReport,
  getUsersReport,
} from "../controllers/adminReportsController.js";

const router = express.Router();

// All /admin/reports/* require admin
router.use("/admin/reports", requireAdmin);

// GET /api/admin/reports/events?startDate=&endDate=&urgency=&format=pdf
router.get("/admin/reports/events", getEventsReport);

// GET /api/admin/reports/users?role=volunteer&format=pdf
router.get("/admin/reports/users", getUsersReport);

export default router;
