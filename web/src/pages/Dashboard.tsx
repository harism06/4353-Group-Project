import { Link } from "react-router-dom";
import { isAdmin } from "@/app/role";

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* other tiles */}

      {isAdmin() && (
        <Link
          to="/events"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Event
        </Link>
      )}
    </div>
  );
}
