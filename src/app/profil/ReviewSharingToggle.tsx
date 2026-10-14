"use client";

import Link from "next/link";
import { useState } from "react";

export function ReviewSharingToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    const next = !enabled;
    setLoading(true);
    setError("");
    const res = await fetch("/api/profile/review-sharing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    if (res.ok) {
      setEnabled(next);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Tercihiniz kaydedilemedi.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-1">
      <label
        className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none w-fit transition-colors"
        style={{ color: enabled ? "#16A34A" : "#6B7280" }}
      >
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          disabled={loading}
          className="relative w-8 h-4 rounded-full transition-colors disabled:opacity-50 shrink-0"
          style={{ background: enabled ? "#16A34A" : "#e5e7eb" }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform"
            style={{ transform: enabled ? "translateX(17px)" : "translateX(2px)" }}
          />
        </button>
        Yorumlarım iş ortaklarında adsız gösterilebilir {enabled ? "(izin verildi)" : "(izin verilmedi)"}
      </label>
      <p className="text-xs text-gray-400 max-w-md">
        Yorum metniniz ve puanlarınız adınız ve fotoğraflarınız olmadan paylaşılır. İsteğe bağlıdır, istediğiniz zaman
        değiştirebilirsiniz. Ayrıntı için <Link href="/gizlilik" className="underline">Gizlilik Politikası</Link>.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
