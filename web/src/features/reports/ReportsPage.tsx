import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Select from "react-select";
import { listEvents, type EventRecord } from "@/api/events";
import {
  downloadVolunteersReport,
  downloadEventsReport,
  previewVolunteersReport,
  previewEventsReport,
} from "@/api/adminReports";

// Available skills matching your system
const SKILLS = [
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

const skillOptions = SKILLS.map((s) => ({ value: s, label: s }));

// Validation schema
const ReportFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  eventId: z.string().optional(),
  skills: z.array(z.string()).optional(),
  format: z.enum(["csv", "pdf"]),
});

type ReportFilters = z.infer<typeof ReportFiltersSchema>;

export default function ReportsPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewType, setPreviewType] = useState<
    "volunteers" | "events" | null
  >(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReportFilters>({
    resolver: zodResolver(ReportFiltersSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      eventId: "",
      skills: [],
      format: "pdf",
    },
  });

  const selectedSkills = watch("skills") || [];

  // Load events for the dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await listEvents();
        setEvents(data);
      } catch (err) {
        console.error("Failed to load events:", err);
      }
    };
    fetchEvents();
  }, []);

  const handleSkillsChange = (selected: any) => {
    setValue("skills", selected ? selected.map((s: any) => s.value) : []);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Download Volunteers Report
  const onDownloadVolunteers = async (data: ReportFilters) => {
    try {
      setLoading(true);
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `volunteers_${timestamp}.${data.format}`;

      await downloadVolunteersReport(
        {
          startDate: data.startDate,
          endDate: data.endDate,
          skills: data.skills,
          format: data.format,
        },
        filename
      );

      showToast(`✓ Downloaded ${filename}`);
    } catch (err: any) {
      console.error("Download failed:", err);
      showToast("❌ Failed to download volunteers report");
    } finally {
      setLoading(false);
    }
  };

  // Download Events Report
  const onDownloadEvents = async (data: ReportFilters) => {
    try {
      setLoading(true);
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `events_${timestamp}.${data.format}`;

      await downloadEventsReport(
        {
          startDate: data.startDate,
          endDate: data.endDate,
          eventId: data.eventId,
          format: data.format,
        },
        filename
      );

      showToast(`✓ Downloaded ${filename}`);
    } catch (err: any) {
      console.error("Download failed:", err);
      showToast("❌ Failed to download events report");
    } finally {
      setLoading(false);
    }
  };

  // Preview Volunteers Report
  const onPreviewVolunteers = async () => {
    try {
      setLoading(true);
      const filters = watch();
      const data = await previewVolunteersReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        skills: filters.skills,
      });
      setPreviewData(data.slice(0, 5)); // Top 5 rows
      setPreviewType("volunteers");
      showToast("✓ Preview loaded");
    } catch (err) {
      console.error("Preview failed:", err);
      showToast("❌ Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  // Preview Events Report
  const onPreviewEvents = async () => {
    try {
      setLoading(true);
      const filters = watch();
      const data = await previewEventsReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        eventId: filters.eventId,
      });
      setPreviewData(data.slice(0, 5)); // Top 5 rows
      setPreviewType("events");
      showToast("✓ Preview loaded");
    } catch (err) {
      console.error("Preview failed:", err);
      showToast("❌ Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: "#ffffff",
      color: "#000000",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "#ffffff",
      color: "#000000",
    }),
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Toast notification */}
      {toast && (
        <div
          className="mb-4 rounded-md border border-blue-300 bg-blue-50 p-3 text-blue-700 shadow"
          aria-live="polite"
        >
          {toast}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-2">Admin Reports</h1>
      <p className="text-gray-600 mb-6">
        Generate and download volunteer participation and event reports
      </p>

      {/* Filters Form */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Report Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Range */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Start Date
            </span>
            <input
              type="date"
              {...register("startDate")}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500"
            />
            {errors.startDate && (
              <p className="text-xs text-red-500 mt-1">
                {errors.startDate.message}
              </p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">End Date</span>
            <input
              type="date"
              {...register("endDate")}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500"
            />
            {errors.endDate && (
              <p className="text-xs text-red-500 mt-1">
                {errors.endDate.message}
              </p>
            )}
          </label>

          {/* Event Selector */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Event (Optional)
            </span>
            <select
              {...register("eventId")}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Events</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          </label>

          {/* Format Selector */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Format</span>
            <select
              {...register("format")}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
            {errors.format && (
              <p className="text-xs text-red-500 mt-1">
                {errors.format.message}
              </p>
            )}
          </label>

          {/* Skills Multi-Select */}
          <div className="md:col-span-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Skills Filter (Optional)
              </span>
              <Select
                isMulti
                options={skillOptions}
                value={skillOptions.filter((opt) =>
                  selectedSkills.includes(opt.value)
                )}
                onChange={handleSkillsChange}
                className="mt-1"
                styles={selectStyles}
                placeholder="Select skills to filter..."
              />
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Volunteers Report Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 shadow border border-indigo-200">
          <h3 className="text-lg font-semibold mb-3 text-indigo-900">
            📊 Volunteers Report
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            Download volunteer participation data including hours, skills, and
            assignments.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={onPreviewVolunteers}
              disabled={loading}
              className="w-full px-4 py-2 bg-white text-indigo-700 border-2 border-indigo-300 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
            >
              {loading ? "Loading..." : "Preview (Top 5)"}
            </button>
            <button
              onClick={handleSubmit(onDownloadVolunteers)}
              disabled={loading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition shadow"
            >
              {loading ? "Downloading..." : "Download Volunteers Report"}
            </button>
          </div>
        </div>

        {/* Events Report Section */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 shadow border border-green-200">
          <h3 className="text-lg font-semibold mb-3 text-green-900">
            📅 Events Report
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            Download event data including assignments, attendance, and
            completion status.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={onPreviewEvents}
              disabled={loading}
              className="w-full px-4 py-2 bg-white text-green-700 border-2 border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
            >
              {loading ? "Loading..." : "Preview (Top 5)"}
            </button>
            <button
              onClick={handleSubmit(onDownloadEvents)}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition shadow"
            >
              {loading ? "Downloading..." : "Download Events Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      {previewData && previewData.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              Preview: {previewType === "volunteers" ? "Volunteers" : "Events"}{" "}
              (Top 5 rows)
            </h3>
            <button
              onClick={() => setPreviewData(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ✕ Close
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(previewData[0]).map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {Object.values(row).map((val, i) => (
                      <td
                        key={i}
                        className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                      >
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Showing {previewData.length} of total records. Download full report
            for complete data.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!previewData && (
        <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
          <p className="text-gray-600">
            Select filters above and click "Preview" to see sample data before
            downloading
          </p>
        </div>
      )}
    </div>
  );
}
