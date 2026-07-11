"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export function EditName({ current }: { current: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { update } = useSession();

  async function save() {
    const trimmed = value.trim();
    if (trimmed.length < 3 || trimmed.length > 30) {
      setError("Ad 3-30 karakter olmalı");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: value }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Hata oluştu");
      setLoading(false);
      return;
    }
    await update({ name: value });
    setEditing(false);
    setLoading(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-gray-900">{value || "—"}</span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          düzenle
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          minLength={3}
          maxLength={30}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
          autoFocus
        />
        <button
          onClick={save}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "#111" }}
        >
          {loading ? "..." : "Kaydet"}
        </button>
        <button
          onClick={() => { setEditing(false); setValue(current); }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          iptal
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
