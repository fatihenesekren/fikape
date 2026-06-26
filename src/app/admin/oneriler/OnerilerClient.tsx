"use client";

import { useState } from "react";
import Link from "next/link";

type Suggestion = {
  id: number;
  brandName: string;
  modelName: string;
  year: number | null;
  categorySlug: string;
  fuelType: string | null;
  trimName: string | null;
  notes: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: { displayName: string | null; email: string } | null;
  productId: number | null;
  productSlug: string | null;
  productStatus: string | null;
};

const FUEL_LABELS: Record<string, string> = {
  GASOLINE: "Benzin", DIESEL: "Dizel", EV: "Elektrikli",
  PHEV: "PHEV", HYBRID: "Hibrit", LPG: "LPG",
};

const CAT_LABELS: Record<string, string> = {
  otomobil: "Otomobil", motosiklet: "Motosiklet", "e-scooter": "E-Scooter",
  "e-bisiklet": "E-Bisiklet", karavan: "Karavan", kamyonet: "Kamyonet",
};

export function OnerilerClient({ initialSuggestions }: { initialSuggestions: Suggestion[] }) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [filter, setFilter]   = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [loading, setLoading] = useState<number | null>(null);
  const [modal, setModal]     = useState<{ suggestion: Suggestion; action: "APPROVED" | "REJECTED" } | null>(null);
  const [adminNote, setAdminNote]   = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  const visible = suggestions.filter((s) => s.status === filter);
  const counts = {
    PENDING:  suggestions.filter((s) => s.status === "PENDING").length,
    APPROVED: suggestions.filter((s) => s.status === "APPROVED").length,
    REJECTED: suggestions.filter((s) => s.status === "REJECTED").length,
  };

  async function handleAction() {
    if (!modal) return;
    setErrorMsg(null);
    setLoading(modal.suggestion.id);
    try {
      const res = await fetch(`/api/admin/oneriler/${modal.suggestion.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: modal.action,
          adminNote: adminNote.trim() || undefined,
          customSlug: customSlug.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? "Bir hata oluştu"); return; }
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === modal.suggestion.id
            ? { ...s, status: modal.action, adminNote: adminNote || null }
            : s
        )
      );
      setModal(null); setAdminNote(""); setCustomSlug("");
    } catch {
      setErrorMsg("Bir hata oluştu");
    } finally {
      setLoading(null);
    }
  }

  function openModal(suggestion: Suggestion, action: "APPROVED" | "REJECTED") {
    setErrorMsg(null); setAdminNote("");
    // Legacy akış için slug öner (productId yoksa)
    if (!suggestion.productId) {
      const parts = [suggestion.brandName, suggestion.modelName, suggestion.trimName, suggestion.year]
        .filter(Boolean).join("-").toLowerCase()
        .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
        .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      setCustomSlug(parts);
    } else {
      setCustomSlug("");
    }
    setModal({ suggestion, action });
  }

  return (
    <div>
      {/* Sekmeler */}
      <div className="flex gap-2 mb-6 border-b border-gray-100 pb-4">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              filter === tab ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab === "PENDING" ? "Bekleyen" : tab === "APPROVED" ? "Onaylanan" : "Reddedilen"}
            {counts[tab] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                filter === tab ? "bg-white/20" : "bg-gray-300 text-gray-700"
              }`}>{counts[tab]}</span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          {filter === "PENDING" ? "Bekleyen öneri yok." : "Kayıt bulunamadı."}
        </div>
      )}

      <div className="space-y-4">
        {visible.map((s) => (
          <div key={s.id} className="border border-gray-200 rounded-2xl p-5 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-gray-900 text-base">
                    {s.brandName} {s.modelName}
                    {s.trimName && <span className="font-normal text-gray-500"> · {s.trimName}</span>}
                  </h3>
                  {s.year && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {s.year}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400 mb-2">
                  <span>{CAT_LABELS[s.categorySlug] ?? s.categorySlug}</span>
                  {s.fuelType && <><span>·</span><span>{FUEL_LABELS[s.fuelType] ?? s.fuelType}</span></>}
                  <span>·</span><span>#{s.id}</span>
                  <span>·</span><span>{new Date(s.createdAt).toLocaleDateString("tr-TR")}</span>
                </div>
                {s.user && (
                  <p className="text-xs text-gray-400 mb-2">
                    Kullanıcı: {s.user.displayName ?? s.user.email}
                  </p>
                )}

                {/* Pending ürün linki */}
                {s.productSlug && (
                  <div className="mb-2">
                    <Link
                      href={`/araclar/${s.productSlug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                    >
                      🔗 /araclar/{s.productSlug}
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                        s.productStatus === "ACTIVE" ? "bg-green-100 text-green-700" :
                        s.productStatus === "REJECTED" ? "bg-red-100 text-red-700" :
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {s.productStatus ?? "PENDING"}
                      </span>
                    </Link>
                  </div>
                )}

                {s.notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                    &ldquo;{s.notes}&rdquo;
                  </p>
                )}
                {s.adminNote && (
                  <p className="text-xs text-blue-600 mt-1">Admin notu: {s.adminNote}</p>
                )}
              </div>

              {s.status === "PENDING" && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openModal(s, "REJECTED")}
                    disabled={loading === s.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Reddet
                  </button>
                  <button
                    onClick={() => openModal(s, "APPROVED")}
                    disabled={loading === s.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Onayla
                  </button>
                </div>
              )}
              {s.status === "APPROVED" && (
                <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Onaylandı</span>
              )}
              {s.status === "REJECTED" && (
                <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Reddedildi</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-1">
              {modal.action === "APPROVED" ? "Öneriyi Onayla" : "Öneriyi Reddet"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {modal.suggestion.brandName} {modal.suggestion.modelName}
              {modal.suggestion.year ? ` (${modal.suggestion.year})` : ""}
            </p>

            {/* Yeni akış: ürün zaten var, slug input gereksiz */}
            {modal.action === "APPROVED" && modal.suggestion.productSlug && (
              <div className="mb-4 px-3 py-2.5 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
                Araç zaten oluşturuldu: <strong>/araclar/{modal.suggestion.productSlug}</strong>
                <br />
                <span className="text-xs text-green-600">Onaylamak ürünü aktif hale getirir ve bekleyen yorumları yayınlar.</span>
              </div>
            )}

            {/* Legacy akış: slug input */}
            {modal.action === "APPROVED" && !modal.suggestion.productSlug && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ürün Slug <span className="text-gray-400 font-normal">(URL&apos;de kullanılır)</span>
                </label>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  fikape.com/araclar/<strong>{customSlug || "..."}</strong>
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Admin Notu <span className="text-gray-400 font-normal">(opsiyonel)</span>
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
                placeholder={modal.action === "REJECTED" ? "Neden reddedildi?" : "Eklemek istediğin not..."}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 resize-none"
              />
            </div>

            {errorMsg && (
              <div className="mb-4 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setModal(null); setErrorMsg(null); }}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleAction}
                disabled={!!loading}
                className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60 ${
                  modal.action === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {loading ? "İşleniyor..." : modal.action === "APPROVED" ? "Onayla" : "Reddet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
