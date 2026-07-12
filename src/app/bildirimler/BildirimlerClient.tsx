"use client";

import { useEffect, useState } from "react";
import { NotificationList, type NotificationData } from "@/components/NotificationList";

export function BildirimlerClient({ notifications }: { notifications: NotificationData[] }) {
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    if (notifications.some((n) => !n.isRead)) {
      fetch("/api/notifications/mark-read", { method: "POST" })
        .then(() => setMarked(true))
        .catch(() => {});
    }
  }, [notifications]);

  return <NotificationList notifications={notifications} dimUnread={!marked} />;
}
