import { Outlet } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import NotificationToast from "../../features/notifications/NotificationToast";

/**
 * Root Layout Component
 * Provides the main layout structure with navbar, footer, and notification toast
 */
export default function RootLayout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="container flex-1 py-8">
        <Outlet />
      </main>
      <Footer />
      {/* Global notification toast component */}
      <NotificationToast />
    </div>
  );
}
