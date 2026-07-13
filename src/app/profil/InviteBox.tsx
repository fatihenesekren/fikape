"use client";

import { useState } from "react";

const BADGE_THRESHOLDS = [
  { count: 10, label: "Topluluk Elçisi" },
  { count: 3, label: "Davetkar" },
  { count: 1, label: "İlk Adım" },
];

export function InviteBox({ referralCode, referralCount }: { referralCode: string; referralCount: number }) {
  const [copied, setCopied] = useState(false);
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/kayit?ref=${referralCode}`
      : `/kayit?ref=${referralCode}`;

  const badge = BADGE_THRESHOLDS.find((b) => referralCount >= b.count);

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
        <p className="text-sm text-gray-500">
          Davet linkinle katılanlar sana bağlanır — rozet kazanırsın.
        </p>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
          <code className="text-xs text-gray-600 flex-1 truncate">{inviteUrl}</code>
          <button
            onClick={handleCopy}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors shrink-0"
          >
            {copied ? "Kopyalandı ✓" : "Kopyala"}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleWhatsapp}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#25D366" }}
          >
            WhatsApp&apos;ta Paylaş
          </button>
          <div className="text-sm text-gray-500 shrink-0">
            <span className="font-bold text-gray-900">{referralCount}</span> kişi katıldı
          </div>
        </div>
      </div>
    </div>
  );
}
