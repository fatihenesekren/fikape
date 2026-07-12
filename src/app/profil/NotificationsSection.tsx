"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NotificationList, type NotificationData } from "@/components/NotificationList";

export function NotificationsSection({
  notifications,
  hasMore,
}: {
  notifications: NotificationData[];
  hasMore: boolean;
}) {
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    if (notifications.some((n) => !n.isRead)) {
      fetch("/api/notifications/mark-read", { method: "POST" })
        .then(() => setMarked(true))
        .catch(() => {});
    }
  }, [notifications]);

  return (
    <div id="bildirimler">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900">Bildirimler</h2>
        {hasMore && (
          <Link href="/bildirimler" className="text-xs font-semibold text-gray-500 hover:text-gray-800">
            Tümünü gör →
          </Link>
        )}
      </div>
      <NotificationList notifications={notifications} dimUnread={!marked} />
    </div>
  );
}
