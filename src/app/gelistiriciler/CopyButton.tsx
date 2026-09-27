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
      className="shrink-0 text-xs font-medium px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
    >
      {copied ? "Kopyalandı ✓" : "Kopyala"}
    </button>
  );
}
