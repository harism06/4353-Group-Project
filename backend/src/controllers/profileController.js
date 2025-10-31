import prisma from "../db/prisma.js";
import { z } from "zod";

// Validation schema matching frontend expectations
const profileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(50, "Full name must be 50 characters or less"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(100, "Address must be 100 characters or less"),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be 100 characters or less"),
  state: z
    .string()
    .min(2, "State is required")
    .max(2, "State must be a 2-letter code"),
  zipcode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid zip code (12345 or 12345-6789)"),
  skills: z.array(z.string()).min(1, "Please select at least one skill"),
  preferences: z.array(z.string()).optional().default([]),
  availability: z.string().min(1, "Please select at least one date"),
});

const toWriteData = (data) => ({
  fullName: data.fullName,
  address: data.address,
  city: data.city,
  state: data.state,
  zipcode: data.zipcode,
  skills: data.skills,
  preferences: data.preferences ?? [],
  availability: data.availability,
});

const toResponse = (profile) => ({
  ...profile,
  skills: Array.isArray(profile.skills) ? profile.skills : [],
  preferences: Array.isArray(profile.preferences)
    ? profile.preferences
    : [],
});

/**
 * GET /api/profiles/me
 * Returns the authenticated user's profile or null if not found
 */
export async function getMyProfile(req, res) {
  try {
    const userId = req.user.sub;

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.json(null);
    }

    res.json(toResponse(profile));
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to load profile" });
  }
}

/**
 * POST /api/profiles
 * Create or update authenticated user's profile
 */
export async function createOrUpdateProfile(req, res) {
  try {
    const userId = req.user.sub;

    // Validate payload
    const validation = profileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(validation.error.flatten());
    }

    const data = validation.data;

    // Check if profile exists
    const existing = await prisma.userProfile.findUnique({
      where: { userId },
    });

    let profile;
    if (existing) {
      // Update existing profile
      profile = await prisma.userProfile.update({
        where: { userId },
        data: toWriteData(data),
      });
    } else {
      // Create new profile
      profile = await prisma.userProfile.create({
        data: {
          userId,
          ...toWriteData(data),
        },
      });
    }

    res.status(existing ? 200 : 201).json(toResponse(profile));
  } catch (error) {
    console.error("Create/update profile error:", error);
    res.status(500).json({ error: "Failed to save profile" });
  }
}

/**
 * PUT /api/profiles
 * Update authenticated user's profile only if it exists
 */
export async function updateProfile(req, res) {
  try {
    const userId = req.user.sub;
    const validation = profileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(validation.error.flatten());
    }

    const existing = await prisma.userProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profile = await prisma.userProfile.update({
      where: { userId },
      data: toWriteData(validation.data),
    });

    res.json(toResponse(profile));
  } catch (error) {
    console.error("Update authenticated profile error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.status(500).json({ error: "Failed to update profile" });
  }
}

/**
 * GET /api/users/:id
 * Get user profile by ID (for compatibility with legacy frontend)
 */
export async function getUserProfile(req, res) {
  try {
    const { id } = req.params;

    if (!id || id.trim() === "") {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: id },
    });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(toResponse(profile));
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ error: "Failed to load profile" });
  }
}

/**
 * PUT /api/users/:id
 * Update user profile by ID (for compatibility with legacy frontend)
 */
export async function updateUserProfile(req, res) {
  try {
    const { id } = req.params;

    if (!id || id.trim() === "") {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Validate payload
    const validation = profileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.errors,
      });
    }

    const data = validation.data;

    // Check if profile exists
    const existing = await prisma.userProfile.findUnique({
      where: { userId: id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Update profile
    const profile = await prisma.userProfile.update({
      where: { userId: id },
      data: {
        fullName: data.fullName,
        address: data.address,
        city: data.city,
        state: data.state,
        zipcode: data.zipcode,
        skills: data.skills,
        preferences: data.preferences,
        availability: data.availability,
      },
    });

    res.json({
      message: "Profile updated successfully",
      user: toResponse(profile),
    });
  } catch (error) {
    console.error("Update user profile error:", error);

    // Handle not found from Prisma
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.status(500).json({ error: "Failed to update profile" });
  }
}
