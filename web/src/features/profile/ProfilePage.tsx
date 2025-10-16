import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../auth/authContext";

// Sample skills data
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

const ProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(50, "Full name must be 50 characters or less"),
  address1: z
    .string()
    .min(1, "Address is required")
    .max(100, "Address must be 100 characters or less"),
  address2: z
    .string()
    .max(100, "Address must be 100 characters or less")
    .optional(),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be 100 characters or less"),
  state: z.string().min(1, "State is required"),
  zipCode: z
    .string()
    .min(5, "Zip code must be at least 5 characters")
    .max(9, "Zip code must be 9 characters or less")
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid zip code (12345 or 12345-6789)"),
  skills: z.array(z.string()).min(1, "Please select at least one skill"),
  preferences: z.string().optional(),
  availability: z
    .array(z.string())
    .min(1, "Please select at least one available date"),
});

type ProfileFormData = z.infer<typeof ProfileSchema>;

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Fetch existing user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/users/${user.id}`);
        const userData = response.data;

        // Populate form with existing data
        reset({
          fullName: userData.fullName || "",
          address1: userData.address1 || "",
          address2: userData.address2 || "",
          city: userData.city || "",
          state: userData.state || "",
          zipCode: userData.zipCode || "",
          skills: userData.skills || [],
          preferences: userData.preferences || "",
          availability: userData.availability || [],
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setErrorMessage("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id, reset]);

  const handleSkillChange = (skill: string, checked: boolean) => {
    if (checked) {
      setValue("skills", [...selectedSkills, skill]);
    } else {
      setValue(
        "skills",
        selectedSkills.filter((s) => s !== skill)
      );
    }
  };

  const handleDateChange = (date: string, checked: boolean) => {
    if (checked) {
      setValue("availability", [...selectedDates, date]);
    } else {
      setValue(
        "availability",
        selectedDates.filter((d) => d !== date)
      );
    }
  };

  const onSubmit = async (values: ProfileFormData) => {
    if (!user?.id) {
      setErrorMessage("User not authenticated. Please log in.");
      return;
    }

    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await axios.put(
        `${API_BASE_URL}/users/${user.id}`,
        values
      );

      console.log("Profile updated:", response.data);
      setSuccessMessage("Profile updated successfully!");

      // Navigate to dashboard after successful update
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error("Error updating profile:", error);

      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // Handle Zod validation errors from backend
        const validationErrors = error.response.data.errors
          .map((err: any) => err.message)
          .join(", ");
        setErrorMessage(`Validation error: ${validationErrors}`);
      } else {
        setErrorMessage("Failed to update profile. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toISOString().split("T")[0];
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
      <p className="text-sm mb-6 text-gray-600">
        Please fill out your profile information to start volunteering.
      </p>

      {successMessage && (
        <div
          aria-live="polite"
          className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-green-700"
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          aria-live="polite"
          className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-700"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Personal Information</h2>

          <label className="block">
            <span className="text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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

        {/* Address Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Address Information</h2>

          <label className="block">
            <span className="text-sm font-medium">
              Address Line 1 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              {...register("address2")}
              maxLength={100}
            />
            {errors.address2 && (
              <p className="text-xs text-red-600 mt-1">
                {errors.address2.message}
              </p>
            )}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm font-medium">
                City <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                {...register("state")}
              >
                <option value="">Select State</option>
                {US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
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
                className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Skills <span className="text-red-500">*</span>
          </h2>
          <p className="text-sm text-gray-600">
            Select all skills that apply to you:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {AVAILABLE_SKILLS.map((skill) => (
              <label
                key={skill}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSkills.includes(skill)}
                  onChange={(e) => handleSkillChange(skill, e.target.checked)}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm">{skill}</span>
              </label>
            ))}
          </div>
          {errors.skills && (
            <p className="text-xs text-red-600 mt-1">{errors.skills.message}</p>
          )}
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Preferences</span>
            <p className="text-xs text-gray-600 mb-2">
              Any special preferences, accommodations, or additional information
            </p>
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-24 resize-vertical"
              {...register("preferences")}
              placeholder="e.g., Prefer morning events, have transportation, can work weekends..."
            />
            {errors.preferences && (
              <p className="text-xs text-red-600 mt-1">
                {errors.preferences.message}
              </p>
            )}
          </label>
        </div>

        {/* Availability */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Availability <span className="text-red-500">*</span>
          </h2>
          <p className="text-sm text-gray-600">
            Select dates when you're available to volunteer:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 max-h-48 overflow-y-auto">
            {availableDates.map((date) => {
              const dateObj = new Date(date);
              const formattedDate = dateObj.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              const dayName = dateObj.toLocaleDateString("en-US", {
                weekday: "short",
              });

              return (
                <label
                  key={date}
                  className="flex flex-col items-center space-y-1 cursor-pointer p-2 border rounded-md hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedDates.includes(date)}
                    onChange={(e) => handleDateChange(date, e.target.checked)}
                    className="rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium">{dayName}</span>
                  <span className="text-xs">{formattedDate}</span>
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

        {/* Submit Button */}
        <div className="pt-4">
          <button
            disabled={submitting}
            className="w-full rounded-md bg-black text-white p-3 disabled:opacity-60 font-medium hover:bg-gray-800 transition"
            type="submit"
          >
            {submitting ? "Saving Profile..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
