import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-zinc-400">Page not found.</p>
      <Link to="/" className="text-brand-500 underline">
        Back home
      </Link>
    </div>
  );
}
