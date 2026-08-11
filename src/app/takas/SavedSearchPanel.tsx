"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SavedSearchRow {
  id: number;
  city: string;
  category: { name: string } | null;
  brand: { name: string } | null;
}

export function SavedSearchPanel({
  isLoggedIn,
  il,
  kategoriId,
  markaId,
  initialSearches,
}: {
  isLoggedIn: boolean;
  il: string;
  kategoriId: number | null;
  markaId: number | null;
  initialSearches: SavedSearchRow[];
}) {
  const router = useRouter();
  const [searches, setSearches] = useState(initialSearches);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (!isLoggedIn || !il) return null;

  async function saveSearch() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: il, categoryId: kategoriId, brandId: markaId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      router.refresh();
      const listRes = await fetch("/api/saved-searches");
      if (listRes.ok) {
        const listData = await listRes.json();
        setSearches(listData.searches);
      }
    } finally {
      setSaving(false);
    }
  }

  async function removeSearch(id: number) {
    setSearches((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
  }

  return (
    <div className="mb-6 -mt-4">
      <div className="flex items-center gap-3">
        <button
          onClick={saveSearch}
          disabled={saving}
          className="text-xs font-semibold text-indigo-600 hover:underline disabled:opacity-60"
        >
          🔔 {saving ? "Kaydediliyor..." : "Bu aramayı kaydet, yeni ilan gelince haber ver"}
        </button>
        {searches.length > 0 && (
          <button onClick={() => setExpanded((v) => !v)} className="text-xs text-gray-400 hover:underline">
            Kayıtlı aramalarım ({searches.length})
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {expanded && searches.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {searches.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
              <span className="text-gray-600">
                📍 {s.city}
                {s.category && ` · ${s.category.name}`}
                {s.brand && ` · ${s.brand.name}`}
              </span>
              <button onClick={() => removeSearch(s.id)} className="text-gray-400 hover:text-red-600">Sil</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
