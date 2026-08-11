"use client";

import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // kullanıcı paylaşım penceresini kapattı — sessizce geç
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="text-[11px] font-semibold text-gray-400 hover:text-indigo-700 transition-colors"
    >
      {copied ? "Kopyalandı ✓" : "🔗 Paylaş"}
    </button>
  );
}
