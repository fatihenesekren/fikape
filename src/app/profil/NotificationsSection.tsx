"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NotificationList, type NotificationData } from "@/components/NotificationList";
import { ScrollFadeBox } from "@/components/ScrollFadeBox";

export function NotificationsSection({
  notifications,
  hasMore,
}: {
  notifications: NotificationData[];
  hasMore: boolean;
}) {
  const [marked, setMarked] = useState(false);
  const kapsayici = useRef<HTMLDivElement>(null);

  // Bildirimler yalnız kullanıcı bu bölümü GERÇEKTEN gördüğünde okundu işaretlenir. Önceden /profil'e girmek (örn. yalnız
  // engellenenleri yönetmek için) görülmemiş tüm bildirimleri sessizce okundu yapıyordu.
  useEffect(() => {
    const el = kapsayici.current;
    if (!el || marked || !notifications.some((n) => !n.isRead)) return;
    let istendi = false;
    const gozlemci = new IntersectionObserver(
      (kayitlar) => {
        if (istendi || !kayitlar.some((k) => k.isIntersecting)) return;
        istendi = true;
        gozlemci.disconnect();
        fetch("/api/notifications/mark-read", { method: "POST" })
          .then(() => setMarked(true))
          .catch(() => {
            istendi = false;
          });
      },
      { threshold: 0.4 },
    );
    gozlemci.observe(el);
    return () => gozlemci.disconnect();
  }, [notifications, marked]);

  return (
    <div id="bildirimler" ref={kapsayici}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900">Bildirimler</h2>
        {hasMore && (
          <Link href="/bildirimler" className="text-xs font-semibold text-gray-500 hover:text-gray-800">
            Tümünü gör →
          </Link>
        )}
      </div>
      <ScrollFadeBox itemCount={notifications.length}>
        <NotificationList notifications={notifications} dimUnread={!marked} />
      </ScrollFadeBox>
    </div>
  );
}
