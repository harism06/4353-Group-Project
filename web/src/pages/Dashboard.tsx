import { Link } from "react-router-dom";
import { isAdmin } from "@/app/role";
import {
  downloadEventsReportPdf,
  downloadUsersReportPdf,
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

  const handleDownloadUsers = async () => {
    try {
      await downloadUsersReportPdf();
    } catch (err) {
      console.error(err);
      alert("Failed to download users report");
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Only admins can see Add Event */}
      {isAdmin() && (
        <Link
          to="/events"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded mb-6"
        >
          Add Event
        </Link>
      )}

      {/* ADMIN REPORTS SECTION */}
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
              onClick={handleDownloadUsers}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download Users Report (PDF)
            </button>
          </div>
        </div>
      )}

      {!isAdmin() && (
        <p className="mt-6 text-sm text-gray-600">
          You are logged in as a volunteer. Admin reports are only available to
          admin users.
        </p>
      )}
    </div>
  );
}
