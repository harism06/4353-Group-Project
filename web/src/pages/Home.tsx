export default function Home() {
  return (
    <section className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-brand-500">Home</h1>

      <p className="text-zinc-400 mt-2">
        Welcome to Volunteer Connect – a simple platform for volunteers to find
        opportunities and track their work.
      </p>

      {/* Image section */}
      <img
        src="/volunteer.jpg"
        alt="Volunteers helping the community"
        className="w-full h-64 object-cover rounded-lg shadow-lg mt-6"
      />

      <ul className="mt-6 list-disc pl-6 text-zinc-300 space-y-1">
        <li>Browse available volunteer events</li>
        <li>View and update your profile</li>
        <li>Check your volunteer history</li>
      </ul>
    </section>
  );
}
