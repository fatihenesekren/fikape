"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FUEL_LABELS } from "@/lib/fuel";

interface SavedSearchRow {
  id: number;
  city: string;
  category: { name: string; slug: string } | null;
  brand: { name: string; slug: string } | null;
  paymentIntent: string | null;
  yearMin: number | null;
  yearMax: number | null;
  kmMin: number | null;
  kmMax: number | null;
  fuelTypes: string[];
  transmissions: string[];
}

const PAYMENT_LABEL: Record<string, string> = {
  SWAP_ONLY: "Sadece takas",
  PAYS_EXTRA: "Üstüne para verir",
  WANTS_EXTRA: "Üstüne para bekliyor",
};

// Kayıtlı bir aramaya tıklayınca aynı filtrelerle /takas'a geri dönmek için —
// önceden kayıtlı aramalar sadece Sil edilebiliyordu, tekrar uygulamanın tek
// yolu filtreleri elle yeniden seçmekti (bkz. kullanıcı geri bildirimi).
function searchHref(s: SavedSearchRow): string {
  const qs = new URLSearchParams();
  qs.set("il", s.city);
  if (s.category) qs.set("kategori", s.category.slug);
  if (s.brand) qs.set("marka", s.brand.slug);
  if (s.paymentIntent) qs.set("odeme", s.paymentIntent);
  if (s.yearMin != null) qs.set("yilMin", String(s.yearMin));
  if (s.yearMax != null) qs.set("yilMax", String(s.yearMax));
  if (s.kmMin != null) qs.set("kmMin", String(s.kmMin));
  if (s.kmMax != null) qs.set("kmMax", String(s.kmMax));
  if (s.fuelTypes.length === 1) qs.set("yakit", s.fuelTypes[0]);
  if (s.transmissions.length === 1) qs.set("vites", s.transmissions[0]);
  return `/takas?${qs.toString()}`;
}

function searchSummary(s: SavedSearchRow): string {
  const parts = [s.city];
  if (s.category) parts.push(s.category.name);
  if (s.brand) parts.push(s.brand.name);
  if (s.paymentIntent) parts.push(PAYMENT_LABEL[s.paymentIntent] ?? s.paymentIntent);
  if (s.yearMin != null || s.yearMax != null) parts.push(`${s.yearMin ?? "…"}–${s.yearMax ?? "…"}`);
  if (s.kmMin != null || s.kmMax != null) {
    parts.push(`${s.kmMin?.toLocaleString("tr-TR") ?? "…"}–${s.kmMax?.toLocaleString("tr-TR") ?? "…"} km`);
  }
  if (s.fuelTypes.length > 0) parts.push(s.fuelTypes.map((f) => FUEL_LABELS[f] ?? f).join("/"));
  if (s.transmissions.length > 0) parts.push(s.transmissions.join("/"));
  return parts.join(" · ");
}

export function SavedSearchPanel({
  isLoggedIn,
  il,
  kategoriId,
  markaId,
  odemeNiyeti,
  yilMin,
  yilMax,
  kmMin,
  kmMax,
  yakit,
  vites,
  initialSearches,
}: {
  isLoggedIn: boolean;
  il: string;
  kategoriId: number | null;
  markaId: number | null;
  odemeNiyeti: string;
  yilMin: number | null;
  yilMax: number | null;
  kmMin: number | null;
  kmMax: number | null;
  yakit: string;
  vites: string;
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
        body: JSON.stringify({
          city: il,
          categoryId: kategoriId,
          brandId: markaId,
          paymentIntent: odemeNiyeti || null,
          yearMin: yilMin,
          yearMax: yilMax,
          kmMin,
          kmMax,
          fuelTypes: yakit ? [yakit] : [],
          transmissions: vites ? [vites] : [],
        }),
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
            <div key={s.id} className="flex items-center justify-between gap-2 text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
              <Link href={searchHref(s)} className="text-gray-600 hover:text-indigo-700 hover:underline">
                📍 {searchSummary(s)}
              </Link>
              <button onClick={() => removeSearch(s.id)} className="text-gray-400 hover:text-red-600 shrink-0">Sil</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
