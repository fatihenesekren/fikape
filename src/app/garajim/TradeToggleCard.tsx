"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TURKISH_CITIES } from "@/lib/turkishCities";
import { PART_CONDITION_CATEGORIES, type PartCondition } from "@/lib/carParts";
import type { DamageStatus, MechanicalCondition, TramerRecordInput } from "@/lib/damageStatus";
import { DAMAGE_STATUS_LABEL } from "@/lib/damageStatus";
import { LOCATION_SCOPES, LOCATION_SCOPE_LABEL, type LocationScope } from "@/lib/tradeExpectations";
import { PartConditionForm } from "./PartConditionForm";
import { DamageStatusForm, EMPTY_DAMAGE_STATUS, type DamageStatusValue } from "./DamageStatusForm";

type PaymentIntent = "SWAP_ONLY" | "PAYS_EXTRA" | "WANTS_EXTRA";
type CloseReason = "TRADED" | "GAVE_UP" | "FOUND_ELSEWHERE";
const ACCEPTABLE_DAMAGE_STATUSES: DamageStatus[] = ["NONE", "DAMAGED", "HEAVY"];

interface ExistingListing {
  id: number;
  isActive: boolean;
  city: string;
  paymentIntent: PaymentIntent;
  note: string | null;
  description: string | null;
  wantAnything: boolean;
  wantCategoryId: number | null;
  wantBrandId: number | null;
  wantLocationScope: LocationScope;
  wantDamageStatuses: DamageStatus[];
  partConditions: Record<string, PartCondition>;
  damageStatus: DamageStatus | null;
  engineCondition: MechanicalCondition | null;
  engineNote: string | null;
  transmissionCondition: MechanicalCondition | null;
  transmissionNote: string | null;
  runningGearCondition: MechanicalCondition | null;
  runningGearNote: string | null;
  tramerRecords: TramerRecordInput[];
}

// Boş metin notlarını null'a çevirir (description/note ile aynı ilke) —
// API'ye gönderilirken kullanılır.
function damageStatusPayload(v: DamageStatusValue) {
  return {
    damageStatus: v.damageStatus,
    engineCondition: v.engineCondition,
    engineNote: v.engineNote.trim() || null,
    transmissionCondition: v.transmissionCondition,
    transmissionNote: v.transmissionNote.trim() || null,
    runningGearCondition: v.runningGearCondition,
    runningGearNote: v.runningGearNote.trim() || null,
    tramerRecords: v.tramerRecords,
  };
}

function damageStatusFromListing(l: ExistingListing | null): DamageStatusValue {
  if (!l) return EMPTY_DAMAGE_STATUS;
  return {
    damageStatus: l.damageStatus,
    engineCondition: l.engineCondition,
    engineNote: l.engineNote ?? "",
    transmissionCondition: l.transmissionCondition,
    transmissionNote: l.transmissionNote ?? "",
    runningGearCondition: l.runningGearCondition,
    runningGearNote: l.runningGearNote ?? "",
    tramerRecords: l.tramerRecords,
  };
}

const PAYMENT_WARNING = (
  <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-2">
    ⚠️ Üstüne para el değiştiren takaslarda dolandırıcılık riski daha yüksektir. Fark tutarını asla
    aracı fiziksel olarak teslim almadan/etmeden önce göndermeyiniz, banka dekontunu &ldquo;teslimat kanıtı&rdquo;
    olarak kabul etmeyiniz.
  </p>
);

export function TradeToggleCard({
  userProductId,
  canOpenTrade,
  categories,
  brands,
  categoryBrandMap,
  existingListing,
  currentUsageAmount,
  productSlug,
  categorySlug,
}: {
  userProductId: number;
  canOpenTrade: boolean;
  categories: { id: number; name: string }[];
  brands: { id: number; name: string }[];
  categoryBrandMap: Record<number, number[]>;
  existingListing: ExistingListing | null;
  currentUsageAmount?: number | null;
  productSlug: string;
  categorySlug: string;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [city, setCity] = useState(existingListing?.city ?? "");
  // Km — Garaj'daki "Alış bilgisi" formuyla AYNI alanı (UserProduct.usageAmount)
  // düzenliyor, tek doğruluk kaynağı bu (bkz. kullanıcı geri bildirimi: "bu
  // bilgi diğer tarafla senkron olmalı"). existingListing'de değil, ayrı bir
  // prop'ta geliyor çünkü bu araca ait, ilana değil.
  const [usageAmountInput, setUsageAmountInput] = useState(
    currentUsageAmount != null ? String(currentUsageAmount) : ""
  );
  const [wantCategoryId, setWantCategoryId] = useState(existingListing?.wantCategoryId?.toString() ?? "");
  const [wantBrandId, setWantBrandId] = useState(existingListing?.wantBrandId?.toString() ?? "");
  const [wantLocationScope, setWantLocationScope] = useState<LocationScope>(
    existingListing?.wantLocationScope ?? "NATIONWIDE"
  );
  const [wantDamageStatuses, setWantDamageStatuses] = useState<DamageStatus[]>(
    existingListing?.wantDamageStatuses ?? []
  );
  const availableBrands = wantCategoryId
    ? brands.filter((b) => categoryBrandMap[Number(wantCategoryId)]?.includes(b.id))
    : brands;
  // wantAnything artık ayrı bir checkbox'la değil, kategori VE marka ikisi de
  // boş bırakıldığında (ikisi de "fark etmez") true olarak türetiliyor.
  const wantAnything = !wantCategoryId && !wantBrandId;
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent>(existingListing?.paymentIntent ?? "SWAP_ONLY");
  const [note, setNote] = useState(existingListing?.note ?? "");
  const [description, setDescription] = useState(existingListing?.description ?? "");
  const [partConditions, setPartConditions] = useState<Record<string, PartCondition | undefined>>(
    existingListing?.partConditions ?? {}
  );
  const [damageStatusValue, setDamageStatusValue] = useState<DamageStatusValue>(
    damageStatusFromListing(existingListing)
  );
  // Hasar Durumu + Boyalı/Değişen Parça sadece gövde paneli olan kategorilerde
  // anlamlı (bkz. carParts.ts) — motosiklet/e-scooter/karavan gibi kategorilerde
  // ikisi de form'da gösterilmiyor (aynı kısıtlama, tutarlılık için).
  const showPartConditions = (PART_CONDITION_CATEGORIES as readonly string[]).includes(categorySlug);
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closeReason, setCloseReason] = useState<CloseReason | "">("");
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewMessage, setRenewMessage] = useState<string | null>(null);
  // Aktif ilan özeti varsayılan kapalı — sürekli açık, renkli bir kutu yerine
  // tıklanınca genişleyen bir çip (bkz. InsuranceLeadCard'daki aynı desen,
  // kullanıcı geri bildirimi: kart görsel olarak çok yoğun/gürültülüydü).
  const [summaryOpen, setSummaryOpen] = useState(false);

  if (!canOpenTrade) {
    return (
      <p className="mt-3 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
        Bu aracı takasa açmak için fotoğraflı, onaylanmış bir yorumunuz olması gerekiyor.
      </p>
    );
  }

  async function reopenListing() {
    setReopening(true);
    setError(null);
    try {
      const res = await fetch(`/api/trades/${existingListing!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reopen" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      router.refresh();
    } finally {
      setReopening(false);
    }
  }

  // Kapalı bir ilan varsa: yeniden aç seçeneği sun.
  if (existingListing && !existingListing.isActive) {
    return (
      <div className="mt-3 border border-gray-100 bg-gray-50 rounded-xl p-3 overflow-hidden">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-gray-500 whitespace-nowrap">Takas ilanınız kapalı.</p>
          <button
            onClick={reopenListing}
            disabled={reopening}
            className="text-xs font-semibold text-indigo-700 hover:underline disabled:opacity-60 shrink-0"
          >
            {reopening ? "Açılıyor..." : "🔄 Yeniden Aç"}
          </button>
        </div>
        <Link href={`/takas/${existingListing.id}`} className="text-[11px] text-gray-400 hover:underline mt-1 inline-block">
          İlanı görüntüle →
        </Link>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // "İlanı Yenile" — createdAt'a dokunmaz, sadece listeleme sıralamasında öne
  // alır. 48 saatlik cooldown API tarafında uygulanıyor, burada sadece hata
  // mesajı (varsa "en erken ne zaman" bilgisi) gösteriliyor.
  async function renewListing() {
    setRenewing(true);
    setRenewMessage(null);
    try {
      const res = await fetch(`/api/trades/${existingListing!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "renew" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRenewMessage(data.error ?? "Bir hata oluştu.");
        return;
      }
      setRenewMessage("İlanınız yenilendi, listenin üst sıralarına taşındı.");
      router.refresh();
    } finally {
      setRenewing(false);
    }
  }

  async function closeListing() {
    setClosing(true);
    try {
      const res = await fetch(`/api/trades/${existingListing!.id}/close`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closeReason: closeReason || null }),
      });
      if (!res.ok) return;
      if (closeReason === "TRADED") {
        // "Sattım" formunu TRADE ön-dolu açacak şekilde araç sayfasına yönlendir —
        // kullanıcı aynı bilgiyi iki ayrı formda tekrar girmesin diye (bkz. denetim raporu).
        router.push(`/araclar/${productSlug}?sat=trade`);
      } else {
        router.refresh();
      }
    } finally {
      setClosing(false);
    }
  }

  async function saveEdit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/trades/${existingListing!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          city,
          wantAnything,
          wantCategoryId: wantCategoryId || null,
          wantBrandId: wantBrandId || null,
          wantLocationScope,
          wantDamageStatuses,
          paymentIntent,
          note: note.trim() || null,
          description: description.trim() || null,
          partConditions,
          usageAmount: usageAmountInput ? Number(usageAmountInput) : null,
          ...damageStatusPayload(damageStatusValue),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      setEditOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  // Aktif bir ilan varsa: özet + düzenle/kapat seçenekleri.
  if (existingListing) {
    if (editOpen) {
      return (
        <div className="mt-3 border border-indigo-100 bg-indigo-50/60 rounded-xl p-3 space-y-2.5 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-indigo-800">İlanı Düzenle</p>
            <button onClick={() => setEditOpen(false)} aria-label="Kapat" className="text-indigo-400 hover:text-indigo-700 text-xs">✕</button>
          </div>
          <TradeFormFields
            city={city} setCity={setCity}
            usageAmountInput={usageAmountInput} setUsageAmountInput={setUsageAmountInput}
            wantCategoryId={wantCategoryId} setWantCategoryId={setWantCategoryId}
            wantBrandId={wantBrandId} setWantBrandId={setWantBrandId}
            wantLocationScope={wantLocationScope} setWantLocationScope={setWantLocationScope}
            wantDamageStatuses={wantDamageStatuses} setWantDamageStatuses={setWantDamageStatuses}
            availableBrands={availableBrands} categories={categories}
            paymentIntent={paymentIntent} setPaymentIntent={setPaymentIntent}
            note={note} setNote={setNote}
            description={description} setDescription={setDescription}
          />
          {showPartConditions && (
            <div className="border-t border-indigo-100 pt-2.5">
              <p className="text-xs font-semibold text-indigo-800 mb-1.5">Hasar Durumu</p>
              <DamageStatusForm value={damageStatusValue} onChange={setDamageStatusValue} />
            </div>
          )}

          {showPartConditions && (
            <div className="border-t border-indigo-100 pt-2.5">
              <p className="text-xs font-semibold text-indigo-800 mb-1.5">Boyalı veya Değişen Parça</p>
              <PartConditionForm value={partConditions} onChange={setPartConditions} />
            </div>
          )}
          {paymentIntent !== "SWAP_ONLY" && PAYMENT_WARNING}
          <button
            onClick={saveEdit}
            disabled={submitting}
            className="w-full text-sm font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
            style={{ background: "#4338ca" }}
          >
            {submitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      );
    }

    if (!summaryOpen) {
      return (
        <button
          onClick={() => setSummaryOpen(true)}
          className="mt-3 w-full flex items-center justify-between gap-2 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl px-3 py-2 transition-colors"
        >
          <span>🔄 Takasa açık</span>
          <span className="text-indigo-400">›</span>
        </button>
      );
    }

    return (
      <div className="mt-3 border border-indigo-100 bg-indigo-50/60 rounded-xl p-3 overflow-hidden">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs font-bold text-indigo-800 whitespace-nowrap">✓ Takasa açık</p>
          <div className="flex items-center gap-3 shrink-0">
            <Link href={`/takas/${existingListing.id}`} className="text-[11px] font-semibold text-gray-400 hover:underline whitespace-nowrap">
              İlanı görüntüle →
            </Link>
            <button onClick={() => setEditOpen(true)} className="text-[11px] font-semibold text-indigo-600 hover:underline whitespace-nowrap">
              Düzenle
            </button>
            <button
              onClick={renewListing}
              disabled={renewing}
              className="text-[11px] font-semibold text-indigo-600 hover:underline whitespace-nowrap disabled:opacity-60"
            >
              {renewing ? "Yenileniyor..." : "🔝 İlanı Yenile"}
            </button>
            <button onClick={() => setSummaryOpen(false)} aria-label="Daralt" className="text-indigo-400 hover:text-indigo-700 text-xs">
              ✕
            </button>
          </div>
        </div>
        {renewMessage && <p className="mt-1.5 text-[11px] text-indigo-700">{renewMessage}</p>}
        {/* Native <select>, flex satırında varsayılan min-width:auto yüzünden
            küçülmüyor ve taşıyordu (bkz. kullanıcı geri bildirimi, ekran
            görüntüsü) — min-w-0+flex-1 ile küçülebilir yapıldı, mobilde
            butonla aynı satırı paylaşmak yerine alt alta diziliyor. */}
        <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
          <select
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value as CloseReason | "")}
            aria-label="Kapatma sebebi"
            className="min-w-0 w-full sm:flex-1 text-xs rounded-lg border border-indigo-200 px-2 py-1.5 bg-white"
          >
            <option value="">Kapatma sebebi (opsiyonel)</option>
            <option value="TRADED">Takas oldu</option>
            <option value="GAVE_UP">Vazgeçtim</option>
            <option value="FOUND_ELSEWHERE">Başka yerden buldum</option>
          </select>
          <button
            onClick={closeListing}
            disabled={closing}
            className="shrink-0 text-xs font-semibold text-indigo-700 hover:underline disabled:opacity-60 text-left sm:text-center"
          >
            İlanı Kapat
          </button>
        </div>
      </div>
    );
  }

  if (!formOpen) {
    return (
      <button
        onClick={() => setFormOpen(true)}
        className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
        style={{ background: "#4338ca" }}
      >
        🔄 Takasa Aç
      </button>
    );
  }

  async function submit() {
    setError(null);
    if (!city) {
      setError("Lütfen ilinizi seçiniz.");
      return;
    }
    if (!consentGiven) {
      setError("İlanı açmak için KVKK onay kutusunu işaretlemelisiniz.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProductId,
          city,
          wantAnything,
          wantCategoryId: wantCategoryId || null,
          wantBrandId: wantBrandId || null,
          wantLocationScope,
          wantDamageStatuses,
          paymentIntent,
          note: note.trim() || null,
          description: description.trim() || null,
          partConditions,
          consentGiven,
          usageAmount: usageAmountInput ? Number(usageAmountInput) : null,
          ...damageStatusPayload(damageStatusValue),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      router.refresh();
    } catch {
      setError("Bir hata oluştu, tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 border border-indigo-100 bg-indigo-50/60 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-indigo-800">Takasa Aç</p>
        <button onClick={() => setFormOpen(false)} aria-label="Kapat" className="text-indigo-400 hover:text-indigo-700 text-xs">✕</button>
      </div>

      <TradeFormFields
        city={city} setCity={setCity}
        usageAmountInput={usageAmountInput} setUsageAmountInput={setUsageAmountInput}
        wantCategoryId={wantCategoryId} setWantCategoryId={setWantCategoryId}
        wantBrandId={wantBrandId} setWantBrandId={setWantBrandId}
        wantLocationScope={wantLocationScope} setWantLocationScope={setWantLocationScope}
        wantDamageStatuses={wantDamageStatuses} setWantDamageStatuses={setWantDamageStatuses}
        availableBrands={availableBrands} categories={categories}
        paymentIntent={paymentIntent} setPaymentIntent={setPaymentIntent}
        note={note} setNote={setNote}
        description={description} setDescription={setDescription}
      />

      {showPartConditions && (
        <div className="border-t border-indigo-100 pt-2.5">
          <p className="text-xs font-semibold text-indigo-800 mb-1.5">Boyalı veya Değişen Parça</p>
          <PartConditionForm value={partConditions} onChange={setPartConditions} />
        </div>
      )}

      {paymentIntent !== "SWAP_ONLY" && PAYMENT_WARNING}

      <p className="text-[11px] text-indigo-700 bg-indigo-100/60 rounded-lg px-2.5 py-2">
        Fark tutarını asla aracı teslim almadan ve aracınızı teslim etmeden önce göndermeyiniz. Araç
        ekspertizi yaptırılmadan takasın kabul edilmemesi önerilir —{" "}
        <Link href={`/araclar/${productSlug}`} className="underline font-semibold">
          ekspertiz/hızlı teklif için araç sayfasına bakın
        </Link>
        . Buluşmayı halka açık, kalabalık bir yerde yapınız. Fikape takas işlemlerinde taraf değildir.
      </p>

      <label className="flex items-start gap-2 text-[11px] text-indigo-800">
        <input
          type="checkbox"
          checked={consentGiven}
          onChange={(e) => setConsentGiven(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          İlimin ve ilan detaylarımın diğer kullanıcılara gösterileceğini,{" "}
          <Link href="/gizlilik" className="underline" target="_blank">Gizlilik Politikası</Link>&apos;nı
          okuduğumu kabul ediyorum.
        </span>
      </label>

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full text-sm font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
        style={{ background: "#4338ca" }}
      >
        {submitting ? "Gönderiliyor..." : "Takasa Aç"}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function TradeFormFields({
  city, setCity,
  usageAmountInput, setUsageAmountInput,
  wantCategoryId, setWantCategoryId,
  wantBrandId, setWantBrandId,
  wantLocationScope, setWantLocationScope,
  wantDamageStatuses, setWantDamageStatuses,
  availableBrands, categories,
  paymentIntent, setPaymentIntent,
  note, setNote,
  description, setDescription,
}: {
  city: string; setCity: (v: string) => void;
  usageAmountInput: string; setUsageAmountInput: (v: string) => void;
  wantCategoryId: string; setWantCategoryId: (v: string) => void;
  wantBrandId: string; setWantBrandId: (v: string) => void;
  wantLocationScope: LocationScope; setWantLocationScope: (v: LocationScope) => void;
  wantDamageStatuses: DamageStatus[]; setWantDamageStatuses: (v: DamageStatus[]) => void;
  availableBrands: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  paymentIntent: PaymentIntent; setPaymentIntent: (v: PaymentIntent) => void;
  note: string; setNote: (v: string) => void;
  description: string; setDescription: (v: string) => void;
}) {
  function toggleDamageStatus(status: DamageStatus) {
    setWantDamageStatuses(
      wantDamageStatuses.includes(status)
        ? wantDamageStatuses.filter((s) => s !== status)
        : [...wantDamageStatuses, status]
    );
  }

  return (
    <>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        aria-label="İl"
        className="w-full text-sm rounded-lg border border-indigo-200 px-2.5 py-1.5 bg-white"
      >
        <option value="">İl seçiniz</option>
        {TURKISH_CITIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Kategori ve marka birbirinden bağımsız "fark etmez" olabilmeli —
          önceden tek bir "Marka/kategori fark etmez" checkbox'ı ikisini
          birlikte kapatıp açıyordu, kullanıcı "kategori: Otomobil ama marka
          fark etmez" gibi bir kombinasyon seçemiyordu (bkz. kullanıcı geri
          bildirimi, ekran görüntüsü). Artık her iki select de her zaman
          görünür, "Fark etmez" ayrı birer seçenek; wantAnything ikisi de
          boş bırakıldığında true olarak türetiliyor (bkz. submit/saveEdit). */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select
          value={wantCategoryId}
          onChange={(e) => { setWantCategoryId(e.target.value); setWantBrandId(""); }}
          aria-label="İstenen kategori"
          className="text-sm rounded-lg border border-indigo-200 px-2.5 py-1.5 bg-white"
        >
          <option value="">Kategori fark etmez</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={wantBrandId}
          onChange={(e) => setWantBrandId(e.target.value)}
          aria-label="İstenen marka"
          className="text-sm rounded-lg border border-indigo-200 px-2.5 py-1.5 bg-white"
        >
          <option value="">Marka fark etmez</option>
          {availableBrands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Aradığı aracın nerede olmasını beklediği — önceden ilan sadece KENDİ
          aracının (city alanı) nerede olduğunu söylüyordu, karşı taraftan
          beklenen konumu hiç belirtemiyordu (bkz. kullanıcı geri bildirimi).
          Boş bırakılırsa varsayılan "Türkiye Genelinde" (Prisma @default). */}
      <fieldset className="text-xs text-indigo-800">
        <legend className="font-semibold mb-1">Aradığım araç nerede olsun?</legend>
        <div className="flex flex-wrap gap-1.5">
          {LOCATION_SCOPES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setWantLocationScope(s)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-colors"
              style={
                wantLocationScope === s
                  ? { background: "#4338ca", borderColor: "#4338ca", color: "#fff" }
                  : { background: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }
              }
            >
              {LOCATION_SCOPE_LABEL[s]}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Aradığı aracın kabul edilebilir hasar durumları — çoklu seçim, hiçbiri
          seçilmezse (ya da "Farketmez" seçilirse) "tüm hasar durumları"
          anlamına gelir (Prisma @default([])). "Farketmez" boş diziyi temsil
          eder; belirli bir durum seçilince dizi doluyor ve "Farketmez"
          otomatik olarak pasif görünür. */}
      <fieldset className="text-xs text-indigo-800">
        <legend className="font-semibold mb-1">Kabul edebileceğim hasar durumu</legend>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setWantDamageStatuses([])}
            className="px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-colors"
            style={
              wantDamageStatuses.length === 0
                ? { background: "#4338ca", borderColor: "#4338ca", color: "#fff" }
                : { background: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }
            }
          >
            Farketmez
          </button>
          {ACCEPTABLE_DAMAGE_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleDamageStatus(s)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-colors"
              style={
                wantDamageStatuses.includes(s)
                  ? { background: "#4338ca", borderColor: "#4338ca", color: "#fff" }
                  : { background: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }
              }
            >
              {DAMAGE_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="text-xs text-indigo-800">
        <legend className="font-semibold mb-1">Ödeme niyeti</legend>
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="paymentIntent" checked={paymentIntent === "SWAP_ONLY"} onChange={() => setPaymentIntent("SWAP_ONLY")} />
            Sadece takas (yakın değer)
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="paymentIntent" checked={paymentIntent === "PAYS_EXTRA"} onChange={() => setPaymentIntent("PAYS_EXTRA")} />
            Üstüne para verebilirim
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="paymentIntent" checked={paymentIntent === "WANTS_EXTRA"} onChange={() => setPaymentIntent("WANTS_EXTRA")} />
            Üstüne para bekliyorum
          </label>
        </div>
      </fieldset>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Opsiyonel not (örn. hangi araçları arıyorsun)"
        maxLength={300}
        rows={2}
        className="w-full text-sm rounded-lg border border-indigo-200 px-2.5 py-1.5 bg-white"
      />

      {/* Km — Garaj'daki "Alış bilgisi" formuyla AYNI alanı düzenliyor, tek
          doğruluk kaynağı UserProduct.usageAmount (bkz. kullanıcı geri
          bildirimi: "diğer tarafla senkron olmalı"). Açıklama'nın hemen
          üstünde — önceden açıklama metninin parantezinde "km" örnek olarak
          geçiyordu, artık kendi alanı olduğu için oradan kaldırıldı. */}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={usageAmountInput}
        onChange={(e) => setUsageAmountInput(e.target.value)}
        placeholder="Km (opsiyonel)"
        aria-label="Aracın kilometresi"
        className="w-full text-sm rounded-lg border border-indigo-200 px-2.5 py-1.5 bg-white"
      />

      <div>
        <label className="block text-xs font-semibold text-indigo-800 mb-1">
          Açıklama <span className="font-normal text-indigo-400">(opsiyonel — bakım geçmişi, aksesuar vb.)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Aracınız hakkında detaylı bilgi verin"
          maxLength={2000}
          rows={4}
          className="w-full text-sm rounded-lg border border-indigo-200 px-2.5 py-1.5 bg-white"
        />
      </div>
    </>
  );
}
