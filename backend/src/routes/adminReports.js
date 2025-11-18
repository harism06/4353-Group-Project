import express from "express";
import { requireAdmin } from "../middleware/adminOnly.js";
import {
  getEventsReport,
  getVolunteersReport,
} from "../controllers/adminReportsController.js";

const router = express.Router();

// All /admin/reports/* require admin
router.use("/admin/reports", requireAdmin);

// GET /api/admin/reports/events(.csv|.pdf)
router.get("/admin/reports/events", getEventsReport);
router.get("/admin/reports/events.:format", getEventsReport);

// GET /api/admin/reports/volunteers(.csv|.pdf)
router.get("/admin/reports/volunteers", getVolunteersReport);
router.get("/admin/reports/volunteers.:format", getVolunteersReport);

export default router;
