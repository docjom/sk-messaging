// components/NotificationHandler.jsx
import { useEffect } from "react";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotification";

export const NotificationHandler = () => {
  const { permission, requestPermission } = useNotifications();

  useEffect(() => {
    if (permission === "default") {
      toast("Enable Notifications", {
        description: "Get notified when you receive new messages",
        action: {
          label: "Enable",
          onClick: () => requestPermission(),
        },
      });
    }
  }, [permission, requestPermission]);

  return null;
};
