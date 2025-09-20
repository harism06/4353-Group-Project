import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <section className="p-6">
      <h1 className="text-3xl font-bold text-blue-600">Hello Tailwind</h1>
      <p className="mt-2 text-gray-700">
        Welcome to your app. You’re logged in.
      </p>

      {/* Add Event Widget */}
      <Link to="/events">
        <div className="mt-6 p-4 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
          <h2 className="text-lg font-semibold">Add Event</h2>
          <p className="text-sm text-blue-100 mt-1">
            Click to go to Event Management
          </p>
        </div>
      </Link>
    </section>
  );
}
