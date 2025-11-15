import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getUserProfile,
  updateUserProfile,
} from "../controllers/profileController.js";

const router = Router();

// Legacy routes for ProfilePage.tsx compatibility
router.get("/users/:id", requireAuth, getUserProfile);
router.put("/users/:id", requireAuth, updateUserProfile);

export default router;
