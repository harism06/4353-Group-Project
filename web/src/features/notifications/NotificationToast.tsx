import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/authContext";
import { sendNotification } from "@/api/notifications";

/**
 * Notification data structure
 */
type Notification = {
  id: string;
  userId: string;
  eventId?: string;
  message: string;
  timestamp: string;
  read: boolean;
};

/**
 * NotificationToast Component
 * Displays toast notifications for user alerts
 * Auto-dismisses after 5 seconds
 */
export default function NotificationToast() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * Remove a notification from the display
   */
  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  /**
   * Auto-dismiss notifications after 5 seconds
   */
  useEffect(() => {
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        dismissNotification(notification.id);
      }, 5000);
      return () => clearTimeout(timer);
    });
  }, [notifications]);

  // If no user is logged in, don't render anything
  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-start justify-between animate-slide-in"
          role="alert"
          aria-live="polite"
        >
          <div className="flex-1">
            <p className="font-semibold">Notification</p>
            <p className="text-sm">{notification.message}</p>
          </div>
          <button
            onClick={() => dismissNotification(notification.id)}
            className="ml-4 text-white hover:text-gray-200 transition-colors"
            aria-label="Dismiss notification"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * Custom hook to send notifications
 * @returns Function to send a notification
 */
export const useNotification = () => {
  const { user } = useAuth();

  /**
   * Send a notification to the backend
   * @param message - The notification message
   * @param eventId - Optional event ID associated with the notification
   */
  const notify = async (message: string, eventId?: string) => {
    if (!user) {
      console.warn("Cannot send notification: User not logged in");
      return;
    }

    try {
      await sendNotification({
        userId: String(user.id),
        message,
        eventId,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  return { notify };
};
