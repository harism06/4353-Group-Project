import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { useAuth } from "@/features/auth/authContext";

// --- keep your original lists if you want; trimmed here for brevity ---
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
  { code: "TX", name: "Texas" },
  { code: "CA", name: "California" },
  { code: "NY", name: "New York" },
  // ...add the rest back...
];

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
  preferences: z.string().optional(),
  availability: z.array(z.string()).min(1, "Please select at least one date"),
});
type ProfileFormData = z.infer<typeof ProfileSchema>;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // only for presence; id is pulled from /auth/me
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
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
      availability: [],
      preferences: "",
    },
  });

  const selectedSkills = watch("skills") || [];
  const selectedDates = watch("availability") || [];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // if we don't even have a token, just show the blank form
        if (!localStorage.getItem("token")) {
          setLoading(false);
          return;
        }

        // 1) who am I?
        const { data: me } = await api.get<{ id: string; role?: string }>(
          "/auth/me"
        );
        const userId = me.id;

        // 2) try to get existing user doc
        const res = await api.get(`/users/${userId}`).catch((e) => {
          if (e?.response?.status === 404) return { data: {} as any };
          throw e;
        });

        const p = res.data || {};
        reset({
          fullName: p.fullName ?? "",
          address1: p.address ?? "",
          address2: "",
          city: p.city ?? "",
          state: p.state ?? "",
          zipCode: p.zipcode ?? "",
          skills: Array.isArray(p.skills) ? p.skills : [],
          preferences: (p.preferences as string) ?? "",
          availability: Array.isArray(p.availability) ? p.availability : [],
        });
      } catch (err) {
        console.error("Load profile failed:", err);
        // still render the form
        setErrorMessage("Failed to load profile. You can still fill and save.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id, reset]);

  const handleSkillChange = (skill: string, checked: boolean) => {
    setValue(
      "skills",
      checked
        ? [...selectedSkills, skill]
        : selectedSkills.filter((s) => s !== skill)
    );
  };
  const handleDateChange = (date: string, checked: boolean) => {
    setValue(
      "availability",
      checked
        ? [...selectedDates, date]
        : selectedDates.filter((d) => d !== date)
    );
  };

  const onSubmit = async (values: ProfileFormData) => {
    try {
      setSubmitting(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      // always resolve current id from /auth/me
      const { data: me } = await api.get<{ id: string }>("/auth/me");
      const userId = me.id;

      const payload = {
        fullName: values.fullName,
        address: values.address1,
        city: values.city,
        state: values.state,
        zipcode: values.zipCode,
        skills: values.skills,
        preferences: values.preferences,
        availability: values.availability,
      };

      await api.put(`/users/${userId}`, payload);
      setSuccessMessage("Profile saved!");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
      console.error("Save profile failed:", err);
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
      <p className="text-sm mb-6 text-gray-400">
        Fill your profile to start volunteering.
      </p>

      {successMessage && (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-green-700">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal */}
        <div>
          <h2 className="text-lg font-semibold">Personal Information</h2>
          <label className="block mt-2">
            <span className="text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
              {...register("fullName")}
              maxLength={50}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 mt-1">
                {errors.fullName.message}
              </p>
            )}
          </label>
        </div>

        {/* Address */}
        <div>
          <h2 className="text-lg font-semibold">Address Information</h2>
          <label className="block mt-2">
            <span className="text-sm font-medium">
              Address Line 1 <span className="text-red-500">*</span>
            </span>
            <input
              className="mt-1 w-full rounded-md border p-2"
              {...register("address1")}
            />
            {errors.address1 && (
              <p className="text-xs text-red-500 mt-1">
                {errors.address1.message}
              </p>
            )}
          </label>

          <label className="block mt-2">
            <span className="text-sm font-medium">Address Line 2</span>
            <input
              className="mt-1 w-full rounded-md border p-2"
              {...register("address2")}
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <label className="block">
              <span className="text-sm font-medium">
                City <span className="text-red-500">*</span>
              </span>
              <input
                className="mt-1 w-full rounded-md border p-2"
                {...register("city")}
              />
              {errors.city && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.city.message}
                </p>
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium">
                State <span className="text-red-500">*</span>
              </span>
              <select
                className="mt-1 w-full rounded-md border p-2"
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
                <p className="text-xs text-red-500 mt-1">
                  {errors.state.message}
                </p>
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium">
                Zip Code <span className="text-red-500">*</span>
              </span>
              <input
                className="mt-1 w-full rounded-md border p-2"
                {...register("zipCode")}
                placeholder="12345 or 12345-6789"
              />
              {errors.zipCode && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.zipCode.message}
                </p>
              )}
            </label>
          </div>
        </div>

        {/* Skills */}
        <div>
          <h2 className="text-lg font-semibold">
            Skills <span className="text-red-500">*</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
            {AVAILABLE_SKILLS.map((skill) => (
              <label key={skill} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedSkills.includes(skill)}
                  onChange={(e) => handleSkillChange(skill, e.target.checked)}
                />
                <span className="text-sm">{skill}</span>
              </label>
            ))}
          </div>
          {errors.skills && (
            <p className="text-xs text-red-500 mt-1">{errors.skills.message}</p>
          )}
        </div>

        {/* Preferences */}
        <div>
          <label className="block">
            <span className="text-sm font-medium">Preferences</span>
            <textarea
              className="mt-1 w-full rounded-md border p-2 h-24"
              {...register("preferences")}
            />
          </label>
        </div>

        {/* Availability */}
        <div>
          <h2 className="text-lg font-semibold">
            Availability <span className="text-red-500">*</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mt-2">
            {availableDates.map((date) => {
              const d = new Date(date);
              const label = d.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <label key={date} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedDates.includes(date)}
                    onChange={(e) => handleDateChange(date, e.target.checked)}
                  />
                  <span className="text-xs">{label}</span>
                </label>
              );
            })}
          </div>
          {errors.availability && (
            <p className="text-xs text-red-500 mt-1">
              {errors.availability.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            disabled={submitting}
            className="w-full rounded-md bg-black text-white p-3 disabled:opacity-60"
            type="submit"
          >
            {submitting ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
