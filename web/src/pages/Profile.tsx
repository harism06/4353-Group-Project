import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios"; // shared axios instance with baseURL=http://localhost:3001/api
import { useAuth } from "@/features/auth/authContext";

/* ---------- Constants ---------- */

const AVAILABLE_SKILLS = [
  "Event Planning",
  "Marketing",
  "Photography",
  "Food Service",
  "Customer Service",
  "First Aid",
  "Teaching",
  "Translation",
  "Technology Support",
  "Fundraising",
  "Social Media",
  "Administrative",
  "Cooking",
  "Driving",
  "Organization",
];

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

/* ---------- Validation (UI shape) ---------- */

const ProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(50),
  address1: z.string().min(1, "Address is required").max(100),
  address2: z.string().max(100).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required"),
  zipCode: z
    .string()
    .min(5, "Zip code must be at least 5 characters")
    .max(10, "Zip code must be 10 characters or less")
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid zip code (12345 or 12345-6789)"),
  skills: z.array(z.string()).min(1, "Please select at least one skill"),
  // In the UI this is a string (textarea), backend wants an array -> we map in onSubmit
  preferences: z.string().optional(),
  // In the UI this is an array of date strings, backend wants a single string -> we map in onSubmit
  availability: z.array(z.string()).min(1, "Please select at least one date"),
});

type ProfileFormData = z.infer<typeof ProfileSchema>;

/* ---------- Component ---------- */

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth(); // only to check presence / gating UI
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      fullName: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zipCode: "",
      skills: [],
      preferences: "",
      availability: [],
    },
  });

  const selectedSkills = watch("skills") || [];
  const selectedDates = watch("availability") || [];

  // Load existing profile
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // if you're logged in, token is attached by axios interceptor
        const { data: p } = await api.get("/profiles/me");

        reset({
          fullName: p?.fullName ?? "",
          address1: p?.address ?? "",
          address2: "",
          city: p?.city ?? "",
          state: p?.state ?? "",
          zipCode: p?.zipcode ?? "",
          // backend sends array -> UI string
          preferences: Array.isArray(p?.preferences)
            ? p.preferences.join(", ")
            : p?.preferences ?? "",
          // backend sends string -> UI array
          availability:
            typeof p?.availability === "string" && p.availability.length
              ? p.availability.split(",").map((s: string) => s.trim())
              : Array.isArray(p?.availability)
              ? p.availability
              : [],
          skills: Array.isArray(p?.skills) ? p.skills : [],
        });
      } catch (err) {
        console.error("GET /profiles/me failed:", err);
        // it's okay if there's no profile yet — keep empty form
      } finally {
        setLoading(false);
      }
    };

    // gate on token existence so we don't 401-loop
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) load();
    else setLoading(false);
  }, [reset]);

  /* ---------- Helpers for UI checkboxes ---------- */

  const handleSkillToggle = (skill: string, checked: boolean) => {
    if (checked) setValue("skills", [...selectedSkills, skill]);
    else
      setValue(
        "skills",
        selectedSkills.filter((s) => s !== skill)
      );
  };

  const handleDateToggle = (date: string, checked: boolean) => {
    if (checked) setValue("availability", [...selectedDates, date]);
    else
      setValue(
        "availability",
        selectedDates.filter((d) => d !== date)
      );
  };

  /* ---------- Submit ---------- */

  const onSubmit = async (values: ProfileFormData) => {
    if (!localStorage.getItem("token")) {
      setError("You must be logged in to save your profile.");
      return;
    }

    setSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      // UI -> backend payload mapping
      const preferencesArray = (values.preferences ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const availabilityString = Array.isArray(values.availability)
        ? values.availability.join(",")
        : (values.availability as unknown as string) ?? "";

      const payload = {
        fullName: values.fullName,
        address: values.address1,
        city: values.city,
        state: values.state,
        zipcode: values.zipCode,
        skills: values.skills,
        preferences: preferencesArray, // backend wants array
        availability: availabilityString, // backend wants string
      };

      await api.post("/profiles", payload); // NOT /users/:id
      setSuccess("Profile saved!");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
      console.error("POST /profiles failed:", err);
      // Surface backend zod-like details if present
      if (err?.response?.data?.fieldErrors || err?.response?.data?.formErrors) {
        console.warn("Field errors:", err.response.data);
      }
      setError("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Date list for next 14 days ---------- */

  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10); // yyyy-mm-dd
  });

  /* ---------- Render ---------- */

  if (loading) return <div className="p-6">Loading profile…</div>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
      <p className="text-sm mb-6 text-gray-400">
        Fill your profile to start volunteering.
      </p>

      {success && (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Personal Information</h2>

          <label className="block">
            <span className="text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-gray-300 p-2 bg-white text-black"
              {...register("fullName")}
              maxLength={50}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 mt-1">
                {errors.fullName.message}
              </p>
            )}
          </label>
        </div>

        {/* Address */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Address Information</h2>

          <label className="block">
            <span className="text-sm font-medium">
              Address Line 1 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-gray-300 p-2 bg-white text-black"
              {...register("address1")}
              maxLength={100}
            />
            {errors.address1 && (
              <p className="text-xs text-red-600 mt-1">
                {errors.address1.message}
              </p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Address Line 2</span>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-gray-300 p-2 bg-white text-black"
              {...register("address2")}
              maxLength={100}
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm font-medium">
                City <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-gray-300 p-2 bg-white text-black"
                {...register("city")}
                maxLength={100}
              />
              {errors.city && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.city.message}
                </p>
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium">
                State <span className="text-red-500">*</span>
              </span>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 p-2 bg-white text-black"
                {...register("state")}
              >
                <option value="">Select State</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.state.message}
                </p>
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium">
                Zip Code <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-gray-300 p-2 bg-white text-black"
                {...register("zipCode")}
                placeholder="12345 or 12345-6789"
                maxLength={10}
              />
              {errors.zipCode && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.zipCode.message}
                </p>
              )}
            </label>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Skills <span className="text-red-500">*</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {AVAILABLE_SKILLS.map((skill) => (
              <label
                key={skill}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={selectedSkills.includes(skill)}
                  onChange={(e) => handleSkillToggle(skill, e.target.checked)}
                />
                <span className="text-sm">{skill}</span>
              </label>
            ))}
          </div>
          {errors.skills && (
            <p className="text-xs text-red-600 mt-1">{errors.skills.message}</p>
          )}
        </div>

        {/* Preferences (textarea string) */}
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Preferences</span>
            <p className="text-xs text-gray-500 mb-2">
              Comma-separated list (e.g.,{" "}
              <em>morning, transportation, weekends</em>)
            </p>
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 p-2 h-24 bg-white text-black"
              placeholder="morning, transportation"
              {...register("preferences")}
            />
          </label>
        </div>

        {/* Availability (array of dates in UI) */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Availability <span className="text-red-500">*</span>
          </h2>
          <p className="text-sm text-gray-500">
            Select dates when you’re available:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 max-h-48 overflow-y-auto">
            {availableDates.map((date) => {
              const d = new Date(date);
              const label = d.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <label
                  key={date}
                  className="flex items-center gap-2 border rounded p-2"
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedDates.includes(date)}
                    onChange={(e) => handleDateToggle(date, e.target.checked)}
                  />
                  <span className="text-xs">{label}</span>
                </label>
              );
            })}
          </div>
          {errors.availability && (
            <p className="text-xs text-red-600 mt-1">
              {errors.availability.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-black text-white p-3 disabled:opacity-60 hover:bg-gray-800 transition"
          >
            {submitting ? "Saving Profile..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
