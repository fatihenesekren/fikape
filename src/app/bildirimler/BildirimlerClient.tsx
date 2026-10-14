"use client";

import { useEffect, useRef, useState } from "react";
import { NotificationList, type NotificationData } from "@/components/NotificationList";
import { emitNotificationsChanged } from "@/lib/notificationSyncCore";

export function BildirimlerClient({ notifications }: { notifications: NotificationData[] }) {
  const [marked, setMarked] = useState(false);
  // Yalnız bu sayfada GÖRÜNEN okunmamışlar işaretlenir (2. sayfadaki görülmemişler okundu olmaz); aynı küme için tek istek.
  const okunmamisImza = notifications.filter((n) => !n.isRead).map((n) => n.id).join(",");
  const gonderilen = useRef("");

  useEffect(() => {
    if (!okunmamisImza || gonderilen.current === okunmamisImza) return;
    gonderilen.current = okunmamisImza;
    const ids = okunmamisImza.split(",").map(Number);
    fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("mark-read başarısız");
        setMarked(true);
        emitNotificationsChanged({ ids }); // zil sayısı hemen düşsün
      })
      .catch(() => {
        gonderilen.current = "";
      });
  }, [okunmamisImza]);

  return <NotificationList notifications={notifications} dimUnread={!marked} />;
}
