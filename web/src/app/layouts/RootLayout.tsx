import { Outlet } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function RootLayout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="container flex-1 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
