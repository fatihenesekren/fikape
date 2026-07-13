"use client";

import Link from "next/link";

export interface NotificationData {
  id: number;
  type: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export const TYPE_ICON: Record<string, string> = {
  NEW_QUESTION: "❓",
  QUESTION_ANSWERED: "💬",
  REVIEW_PUBLISHED: "🎉",
  REVIEW_HELPFUL: "👍",
  NEW_MODEL_IN_BRAND: "🚗",
  REMINDER: "✍️",
  UPDATE_REMINDER: "🔄",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

export function NotificationList({ notifications, dimUnread }: { notifications: NotificationData[]; dimUnread: boolean }) {
  if (notifications.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center text-gray-400 text-sm">
        Henüz bir bildirimin yok.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <Link
          key={n.id}
          href={n.link}
          className="flex items-start gap-3 bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors"
          style={{ background: !n.isRead && dimUnread ? "#F0F7FF" : undefined }}
        >
          <span className="text-lg shrink-0">{TYPE_ICON[n.type] ?? "🔔"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800">{n.message}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(n.createdAt)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
