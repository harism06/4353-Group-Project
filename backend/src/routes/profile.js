import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getMyProfile,
  createOrUpdateProfile,
} from "../controllers/profileController.js";

const r = Router();

// Get authenticated user's profile
r.get("/profiles/me", requireAuth, getMyProfile);

// Create or update authenticated user's profile
r.post("/profiles", requireAuth, createOrUpdateProfile);

export default r;
