"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TURKISH_CITIES } from "@/lib/turkishCities";

// Bölge tercihi — ısrarcı olmayan, opt-in davet (§9: "yerellik varsayılan
// değil"). Yalnızca giriş yapmış ve henüz il beyan etmemiş kullanıcıya,
// yalnızca Türkiye geneli fallback gösterildiğinde görünür. Reddedilirse
// (kapat) o oturumda bir daha gösterilmez.
export function RegionOptInPrompt() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);

  if (dismissed) return null;

  async function selectCity(city: string) {
    setSaving(true);
    try {
      await fetch("/api/profile/city", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!expanded) {
    return (
      <div className="px-5 pb-2.5 -mt-1 flex items-center gap-2 text-[11px] text-gray-400">
        <span>Bölgenizi seçerseniz size yakın ustaları önce gösterebiliriz.</span>
        <button type="button" onClick={() => setExpanded(true)} className="font-medium text-gray-600 hover:text-gray-900 underline underline-offset-2 shrink-0">
          Bölgenizi seçin
        </button>
        <button type="button" onClick={() => setDismissed(true)} aria-label="Kapat" className="ml-auto text-gray-300 hover:text-gray-500 shrink-0">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-3 -mt-1">
      <select
        autoFocus
        disabled={saving}
        defaultValue=""
        onChange={(e) => e.target.value && selectCity(e.target.value)}
        className="w-full sm:w-auto bg-white text-gray-700 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-gray-400"
      >
        <option value="" disabled>İl seçin…</option>
        {TURKISH_CITIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}
