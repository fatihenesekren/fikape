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
  TRADE_INTEREST: "🤝",
  NEW_TRADE_MESSAGE: "🤝",
  TRADE_INTEREST_LOST: "👋",
  TRADE_RATED: "⭐",
  TRADE_MUTUAL_MATCH: "✨",
  ADMIN_NEW_REVIEW: "💬",
  ADMIN_NEW_SUGGESTION: "🚗",
  ADMIN_NEW_LEAD: "🛡️",
  ADMIN_NEW_MESSAGE_REPORT: "🚩",
  ADMIN_NEW_CONTENT_REPORT: "⚠️",
  ADMIN_NEW_DELETION_REQUEST: "🗑️",
};

export const TYPE_LABEL: Record<string, string> = {
  NEW_QUESTION: "Soru-Cevap",
  QUESTION_ANSWERED: "Soru-Cevap",
  REVIEW_PUBLISHED: "Yorumun",
  REVIEW_HELPFUL: "Yorumun",
  NEW_MODEL_IN_BRAND: "Yeni Model",
  REMINDER: "Hatırlatma",
  UPDATE_REMINDER: "Hatırlatma",
  TRADE_INTEREST: "Takas",
  NEW_TRADE_MESSAGE: "Takas",
  TRADE_INTEREST_LOST: "Takas",
  TRADE_RATED: "Takas",
  TRADE_MUTUAL_MATCH: "Takas",
  ADMIN_NEW_REVIEW: "Admin",
  ADMIN_NEW_SUGGESTION: "Admin",
  ADMIN_NEW_LEAD: "Admin",
  ADMIN_NEW_MESSAGE_REPORT: "Admin",
  ADMIN_NEW_CONTENT_REPORT: "Admin",
  ADMIN_NEW_DELETION_REQUEST: "Admin",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

export function NotificationList({ notifications, dimUnread }: { notifications: NotificationData[]; dimUnread: boolean }) {
  if (notifications.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-12 text-center space-y-3">
        <div className="text-4xl">🔔</div>
        <p className="font-semibold text-gray-800">Henüz bir bildirimin yok</p>
        <p className="text-sm text-gray-400">
          Sorularına cevap geldiğinde veya yorumun yayınlandığında burada göreceksiniz.
        </p>
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
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{TYPE_LABEL[n.type] ?? "Bildirim"}</p>
            <p className="text-sm text-gray-800 mt-0.5">{n.message}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(n.createdAt)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
