"use client";

import { useState } from "react";

const BADGES = [
  { count: 1, label: "İlk Adım" },
  { count: 3, label: "Davetkar" },
  { count: 10, label: "Topluluk Elçisi" },
];

export function InviteBox({ referralCode, referralCount }: { referralCode: string; referralCount: number }) {
  const [copied, setCopied] = useState(false);
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/kayit?ref=${referralCode}`
      : `/kayit?ref=${referralCode}`;

  const badge = [...BADGES].reverse().find((b) => referralCount >= b.count);
  const nextBadge = BADGES.find((b) => referralCount < b.count);

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsapp() {
    const text = `fikape'de araç yorumları yazıyorum, sen de gel: ${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 className="text-base font-bold text-gray-900">Arkadaşını Davet Et</h2>
        {badge && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "#EAF3DE", color: "#27500A" }}
          >
            🏅 {badge.label}
          </span>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500 leading-snug">
            Davet linkinle katılanlar sana bağlanır — rozet kazanırsın.
          </p>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-gray-900 leading-none">{referralCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">kişi katıldı</div>
          </div>
        </div>

        {nextBadge && (
          <div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (referralCount / nextBadge.count) * 100)}%`,
                  background: "#25D366",
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              <strong className="text-gray-600">{nextBadge.label}</strong> rozetine{" "}
              {nextBadge.count - referralCount} kişi kaldı
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
          <code className="text-xs text-gray-600 flex-1 truncate">{inviteUrl}</code>
          <button
            onClick={handleCopy}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors shrink-0"
          >
            {copied ? "Kopyalandı ✓" : "Kopyala"}
          </button>
        </div>

        <button
          onClick={handleWhatsapp}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ background: "#25D366" }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M17.6 6.3A8.9 8.9 0 0 0 12.04 3.5 8.9 8.9 0 0 0 3.5 12.04c0 1.58.41 3.12 1.2 4.48L3.4 20.6l4.2-1.28a8.9 8.9 0 0 0 4.44 1.18h.01a8.9 8.9 0 0 0 8.54-8.54c0-2.38-.93-4.62-2.6-6.3zm-5.56 12.9h-.01a7.4 7.4 0 0 1-3.77-1.03l-.27-.16-2.8.85.86-2.73-.18-.28a7.4 7.4 0 0 1-1.13-3.94A7.4 7.4 0 0 1 12.05 5a7.35 7.35 0 0 1 5.22 2.16 7.35 7.35 0 0 1 2.15 5.22 7.4 7.4 0 0 1-7.38 6.82zm4.05-5.53c-.22-.11-1.31-.65-1.52-.72-.2-.08-.35-.11-.5.11-.15.22-.57.72-.7.87-.13.15-.26.16-.48.05-.22-.11-.93-.34-1.78-1.1-.66-.58-1.1-1.31-1.23-1.53-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.36.07-.15.04-.28-.02-.39-.07-.11-.5-1.2-.68-1.65-.18-.43-.36-.37-.5-.38h-.43c-.15 0-.39.05-.59.28-.2.22-.78.76-.78 1.85s.8 2.14.91 2.29c.11.15 1.57 2.4 3.81 3.36.53.23.95.37 1.27.47.53.17 1.02.15 1.4.09.43-.06 1.31-.53 1.49-1.05.18-.51.18-.95.13-1.05-.06-.1-.2-.16-.42-.27z" />
          </svg>
          WhatsApp&apos;ta Paylaş
        </button>
      </div>
    </div>
  );
}
