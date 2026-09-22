"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Panoya erişim reddedilirse sessizce yok say — buton her zaman tıklanabilir kalır.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-md bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition-colors"
    >
      {copied ? "Kopyalandı ✓" : "Kopyala"}
    </button>
  );
}
