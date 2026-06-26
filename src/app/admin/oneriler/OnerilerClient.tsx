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

// ── Teknik özellik field tanımları ──────────────────────────────────────────

type FieldDef =
  | { key: string; label: string; type: "number"; unit?: string; placeholder?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "boolean" }
  | { key: string; label: string; type: "text"; placeholder?: string };

const SPEC_FIELDS: Record<string, FieldDef[]> = {
  otomobil: [
    { key: "body_type",    label: "Kasa",      type: "select", options: [
      { value: "sedan", label: "Sedan" }, { value: "hatchback", label: "Hatchback" },
      { value: "suv", label: "SUV" }, { value: "mpv", label: "MPV" },
      { value: "coupe", label: "Coupe" }, { value: "cabrio", label: "Cabriolet" },
      { value: "pickup", label: "Pickup" }, { value: "van", label: "Van" },
    ]},
    { key: "segment",      label: "Segment",   type: "select", options: [
      { value: "A", label: "A Segment" }, { value: "B", label: "B Segment" },
      { value: "C", label: "C Segment" }, { value: "D", label: "D Segment" },
      { value: "E", label: "E Segment" },
    ]},
    { key: "drivetrain",   label: "Çekiş",     type: "select", options: [
      { value: "FWD", label: "Önden Çekiş (FWD)" }, { value: "RWD", label: "Arkadan İtiş (RWD)" },
      { value: "AWD", label: "Dört Çeker (AWD)" }, { value: "4WD", label: "4WD" },
    ]},
    { key: "transmission", label: "Vites",     type: "select", options: [
      { value: "Manuel", label: "Manuel" }, { value: "Otomatik", label: "Otomatik" },
      { value: "CVT", label: "CVT" }, { value: "Yarı Otomatik", label: "Yarı Otomatik" },
    ]},
    { key: "engine_cc",    label: "Motor",     type: "number", unit: "cc" },
    { key: "power_hp",     label: "Güç",       type: "number", unit: "HP" },
    { key: "torque_nm",    label: "Tork",      type: "number", unit: "Nm" },
    { key: "zero_to_100",  label: "0–100",     type: "number", unit: "sn", placeholder: "örn. 8.5" },
    { key: "top_speed_kmh",label: "Azami Hız", type: "number", unit: "km/s" },
    { key: "tank_l",       label: "Yakıt Dep.",type: "number", unit: "L" },
    { key: "battery_kwh",  label: "Batarya",   type: "number", unit: "kWh" },
    { key: "ev_range_km",  label: "Menzil",    type: "number", unit: "km (WLTP)" },
    { key: "boot_l",       label: "Bagaj",     type: "number", unit: "L" },
    { key: "weight_kg",    label: "Ağırlık",   type: "number", unit: "kg" },
  ],
  motosiklet: [
    { key: "moto_type",    label: "Tip",       type: "select", options: [
      { value: "naked", label: "Naked" }, { value: "sport", label: "Spor" },
      { value: "adventure", label: "Adventure" }, { value: "touring", label: "Touring" },
      { value: "elektrikli", label: "Elektrikli" },
    ]},
    { key: "engine_cc",    label: "Motor",      type: "number", unit: "cc" },
    { key: "power_hp",     label: "Güç",        type: "number", unit: "HP" },
    { key: "torque_nm",    label: "Tork",       type: "number", unit: "Nm" },
    { key: "gearbox",      label: "Şanzıman",   type: "number", unit: "vites", placeholder: "örn. 6" },
    { key: "abs",          label: "ABS",        type: "boolean" },
    { key: "tank_l",       label: "Depo",       type: "number", unit: "L" },
    { key: "weight_kg",    label: "Ağırlık",    type: "number", unit: "kg" },
    { key: "seat_height_mm", label: "Sele Yüks.", type: "number", unit: "mm" },
    { key: "ev_range_km",  label: "Menzil (EV)", type: "number", unit: "km" },
  ],
  "e-scooter": [
    { key: "motor_watt",    label: "Motor Gücü",   type: "number", unit: "W" },
    { key: "range_km",      label: "Menzil",       type: "number", unit: "km" },
    { key: "max_speed_kmh", label: "Maks. Hız",    type: "number", unit: "km/s" },
    { key: "battery_wh",    label: "Batarya",      type: "number", unit: "Wh" },
    { key: "weight_kg",     label: "Ağırlık",      type: "number", unit: "kg" },
    { key: "charge_hours",  label: "Şarj Süresi",  type: "number", unit: "saat" },
    { key: "ip_rating",     label: "Su Ger.",       type: "text", placeholder: "örn. IP54" },
    { key: "max_load_kg",   label: "Maks. Yük",    type: "number", unit: "kg" },
    { key: "tire_inch",     label: "Lastik",       type: "number", unit: "\"" },
  ],
  "e-bisiklet": [
    { key: "bike_type",    label: "Bisiklet Tipi", type: "select", options: [
      { value: "sehir", label: "Şehir" }, { value: "mtb", label: "MTB" },
      { value: "yol", label: "Yol" }, { value: "kargo", label: "Kargo" },
      { value: "katlanabilir", label: "Katlanabilir" },
    ]},
    { key: "motor_type",   label: "Motor Tipi",    type: "select", options: [
      { value: "mid-drive", label: "Mid-Drive" }, { value: "hub-drive", label: "Hub-Drive" },
    ]},
    { key: "pedelec_class", label: "Pedelec",      type: "select", options: [
      { value: "standard-25", label: "25 km/h Standart" }, { value: "speed-45", label: "45 km/h Speed" },
    ]},
    { key: "motor_watt",   label: "Motor Gücü",    type: "number", unit: "W" },
    { key: "battery_wh",   label: "Batarya",       type: "number", unit: "Wh" },
    { key: "range_km",     label: "Menzil",        type: "number", unit: "km" },
    { key: "max_speed_kmh",label: "Maks. Hız",     type: "number", unit: "km/s" },
    { key: "weight_kg",    label: "Ağırlık",       type: "number", unit: "kg" },
  ],
  karavan: [
    { key: "karavan_type", label: "Tip",            type: "select", options: [
      { value: "cekme", label: "Çekme Karavan" }, { value: "motorlu", label: "Motorlu Karavan" },
    ]},
    { key: "berth",          label: "Yatak Kap.",   type: "number", unit: "kişi" },
    { key: "length_cm",      label: "Uzunluk",      type: "number", unit: "cm" },
    { key: "width_cm",       label: "Genişlik",     type: "number", unit: "cm" },
    { key: "total_weight_kg",label: "Toplam Ağ.",   type: "number", unit: "kg" },
    { key: "tow_weight_kg",  label: "Çekme Ağ.",    type: "number", unit: "kg" },
    { key: "has_bathroom",   label: "Banyo",        type: "boolean" },
    { key: "has_kitchen",    label: "Mutfak",       type: "boolean" },
    { key: "has_ac",         label: "Klima",        type: "boolean" },
  ],
  kamyonet: [
    { key: "body_type",     label: "Kasa",          type: "select", options: [
      { value: "van", label: "Van" }, { value: "pickup", label: "Pickup" },
      { value: "panel", label: "Panel" },
    ]},
    { key: "engine_cc",     label: "Motor",         type: "number", unit: "cc" },
    { key: "power_hp",      label: "Güç",           type: "number", unit: "HP" },
    { key: "torque_nm",     label: "Tork",          type: "number", unit: "Nm" },
    { key: "four_wd",       label: "4×4",           type: "boolean" },
    { key: "payload_kg",    label: "Yük Kap.",      type: "number", unit: "kg" },
    { key: "tow_capacity_kg",label: "Çekme Kap.",   type: "number", unit: "kg" },
    { key: "tank_l",        label: "Yakıt Dep.",    type: "number", unit: "L" },
  ],
};

// ── Spec Form bileşeni ────────────────────────────────────────────────────────

function SpecForm({
  categorySlug,
  attrs,
  onChange,
}: {
  categorySlug: string;
  attrs: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const fields = SPEC_FIELDS[categorySlug] ?? [];
  if (fields.length === 0) return null;

  const inputCls = "w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-gray-400 bg-white";

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-700 mb-2">
        Teknik Özellikler <span className="text-gray-400 font-normal">(opsiyonel — boş bırakılanlar kaydedilmez)</span>
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
              {f.label}{f.type === "number" && "unit" in f && f.unit ? <span className="font-normal ml-1 text-gray-400">({f.unit})</span> : ""}
            </label>

            {f.type === "select" && (
              <select
                value={attrs[f.key] ?? ""}
                onChange={(e) => onChange(f.key, e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}

            {f.type === "boolean" && (
              <select
                value={attrs[f.key] ?? ""}
                onChange={(e) => onChange(f.key, e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                <option value="true">Var</option>
                <option value="false">Yok</option>
              </select>
            )}

            {(f.type === "number" || f.type === "text") && (
              <input
                type={f.type === "number" ? "number" : "text"}
                min={0}
                step="any"
                value={attrs[f.key] ?? ""}
                placeholder={"placeholder" in f ? f.placeholder : ""}
                onChange={(e) => onChange(f.key, e.target.value)}
                className={inputCls}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────

export function OnerilerClient({ initialSuggestions }: { initialSuggestions: Suggestion[] }) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [filter, setFilter]   = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [loading, setLoading] = useState<number | null>(null);
  const [modal, setModal]     = useState<{ suggestion: Suggestion; action: "APPROVED" | "REJECTED" } | null>(null);
  const [adminNote, setAdminNote]   = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [attrs, setAttrs]     = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  const visible = suggestions.filter((s) => s.status === filter);
  const counts = {
    PENDING:  suggestions.filter((s) => s.status === "PENDING").length,
    APPROVED: suggestions.filter((s) => s.status === "APPROVED").length,
    REJECTED: suggestions.filter((s) => s.status === "REJECTED").length,
  };

  function handleAttrChange(key: string, value: string) {
    setAttrs((prev) => {
      const next = { ...prev };
      if (value === "") delete next[key];
      else next[key] = value;
      return next;
    });
  }

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
          attributes: modal.action === "APPROVED" && Object.keys(attrs).length > 0 ? attrs : undefined,
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
      setModal(null); setAdminNote(""); setCustomSlug(""); setAttrs({});
    } catch {
      setErrorMsg("Bir hata oluştu");
    } finally {
      setLoading(null);
    }
  }

  function openModal(suggestion: Suggestion, action: "APPROVED" | "REJECTED") {
    setErrorMsg(null); setAdminNote(""); setAttrs({});
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
    // fuelType varsa attrs'e pre-fill et
    if (action === "APPROVED" && suggestion.fuelType) {
      setAttrs({ fuel_type: suggestion.fuelType });
    }
    setModal({ suggestion, action });
  }

  return (
    <div>
      {/* Sekmeler + Cache temizle */}
      <div className="flex items-center justify-between gap-2 mb-6 border-b border-gray-100 pb-4">
        <div className="flex gap-2">
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
        <button
          onClick={async () => {
            await fetch("/api/admin/revalidate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tag: "hero" }) });
            alert("Hero cache temizlendi.");
          }}
          className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          Cache Temizle
        </button>
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
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-8">
            <h2 className="font-bold text-gray-900 text-lg mb-1">
              {modal.action === "APPROVED" ? "Öneriyi Onayla" : "Öneriyi Reddet"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {modal.suggestion.brandName} {modal.suggestion.modelName}
              {modal.suggestion.year ? ` (${modal.suggestion.year})` : ""}
              {" · "}{CAT_LABELS[modal.suggestion.categorySlug] ?? modal.suggestion.categorySlug}
            </p>

            {modal.action === "APPROVED" && modal.suggestion.productSlug && (
              <div className="mb-4 px-3 py-2.5 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
                Araç zaten oluşturuldu: <strong>/araclar/{modal.suggestion.productSlug}</strong>
                <br />
                <span className="text-xs text-green-600">Onaylamak ürünü aktif hale getirir ve bekleyen yorumları yayınlar.</span>
              </div>
            )}

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

            {/* Teknik özellik formu — sadece APPROVED'da */}
            {modal.action === "APPROVED" && (
              <SpecForm
                categorySlug={modal.suggestion.categorySlug}
                attrs={attrs}
                onChange={handleAttrChange}
              />
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
                onClick={() => { setModal(null); setErrorMsg(null); setAttrs({}); }}
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
