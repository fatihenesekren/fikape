"use client";

import { ShareIcon } from "@/components/icons";
import { shareOrOpenWhatsApp } from "@/lib/share";

export function ShareButton({ title }: { title: string }) {
  function handleShare() {
    void shareOrOpenWhatsApp({ url: window.location.href, title });
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full px-2.5 py-1 transition-colors"
    >
      <ShareIcon size={13} />
      Paylaş
    </button>
  );
}
