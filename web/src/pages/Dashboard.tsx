import { Link } from "react-router-dom";
import { isAdmin } from "@/app/role";
import {
  downloadEventsReportPdf,
  downloadVolunteersReportPdf,
} from "@/api/adminReports";

export default function Dashboard() {
  const handleDownloadEvents = async () => {
    try {
      await downloadEventsReportPdf();
    } catch (err) {
      console.error(err);
      alert("Failed to download events report");
    }
  };

  const handleDownloadVolunteers = async () => {
    try {
      await downloadVolunteersReportPdf();
    } catch (err) {
      console.error(err);
      alert("Failed to download volunteers report");
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* ADMIN: Add event button */}
      {isAdmin() && (
        <Link
          to="/events"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded mb-6"
        >
          Add Event
        </Link>
      )}

      {/* ADMIN REPORT SECTION */}
      {isAdmin() && (
        <div className="mt-8 p-6 bg-gray-100 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Admin Reports</h2>
          <p className="text-sm text-gray-600 mb-4">
            Download PDF reports for events and registered users.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleDownloadEvents}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Download Events Report (PDF)
            </button>

            <button
              onClick={handleDownloadVolunteers}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download Volunteers Report (PDF)
            </button>
          </div>
        </div>
      )}

      {/* VOLUNTEER VIEW */}
      {!isAdmin() && (
        <div className="mt-8 p-6 bg-gray-900 border border-gray-700 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-300 mb-3">
            Volunteer Dashboard
          </h2>
          <p className="text-gray-400 mb-4">
            Here are quick actions to help you manage your activity:
          </p>

          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li>View and update your profile</li>
            <li>Check your volunteer history</li>
            <li>Browse upcoming events</li>
          </ul>
        </div>
      )}
    </div>
  );
}
