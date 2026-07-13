"use client";

import { useState } from "react";

export function NotificationToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !enabled;
    setLoading(true);
    const res = await fetch("/api/profile/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    if (res.ok) setEnabled(next);
    setLoading(false);
  }

  return (
    <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none w-fit">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        disabled={loading}
        className="relative w-8 h-4 rounded-full transition-colors disabled:opacity-50"
        style={{ background: enabled ? "#111" : "#e5e7eb" }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform"
          style={{ transform: enabled ? "translateX(17px)" : "translateX(2px)" }}
        />
      </button>
      E-posta bildirimleri {enabled ? "açık" : "kapalı"}
    </label>
  );
}
