"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Chip } from "@/lib/chips";
import { validateDetailShort } from "@/lib/reviewValidation";
import { FIKAPE } from "@/lib/fikape";
import {
  OWNERSHIP_MONTHS, buildExtendedData, ownershipSlotFromMonths, turkeySpecificValuesFromExtendedData,
} from "@/lib/reviewFormOptions";
import { SectionCard, FieldFeedback } from "@/components/review/FormPrimitives";
import { ScoreSelector } from "@/components/review/ScoreSelector";
import { ProConChipSelector } from "@/components/review/ProConChipSelector";
import { OwnershipUsageSection } from "@/components/review/OwnershipUsageSection";
import { TurkeySpecificSection } from "@/components/review/TurkeySpecificSection";
import { PhotoUploader, type ExistingPhoto } from "@/components/review/PhotoUploader";

interface Props {
  reviewId: number;
  productSlug: string;
  chips: Chip[];
  fuelType: string | null;
  categorySlug: string;
  initialPros: string[];
  initialCons: string[];
  initialDetailText: string;
  initialWouldBuyAgain: boolean | null;
  initialScoreFiyat: number;
  initialScoreKalite: number;
  initialScorePerformans: number;
  initialOwnershipMonths: number | null;
  initialExtendedData: Record<string, unknown>;
  initialPhotos: ExistingPhoto[];
}

export function UpdateReviewForm({
  reviewId,
  productSlug,
  chips,
  fuelType,
  categorySlug,
  initialPros,
  initialCons,
  initialDetailText,
  initialWouldBuyAgain,
  initialScoreFiyat,
  initialScoreKalite,
  initialScorePerformans,
  initialOwnershipMonths,
  initialExtendedData,
  initialPhotos,
}: Props) {
  const router = useRouter();
  const [pros, setPros] = useState<string[]>(initialPros);
  const [cons, setCons] = useState<string[]>(initialCons);
  const [detailText, setDetailText] = useState(initialDetailText);
  const [wouldRecommend, setWouldRecommend] = useState<"yes" | "maybe" | "no" | null>(
    initialWouldBuyAgain === true ? "yes" : initialWouldBuyAgain === false ? "no" : null
  );
  const [scoreFiyat, setScoreFiyat] = useState(initialScoreFiyat);
  const [scoreKalite, setScoreKalite] = useState(initialScoreKalite);
  const [scorePerformans, setScorePerformans] = useState(initialScorePerformans);
  const [ownershipSlot, setOwnershipSlot] = useState(ownershipSlotFromMonths(initialOwnershipMonths));
  const [turkeySpecific, setTurkeySpecific] = useState(turkeySpecificValuesFromExtendedData(initialExtendedData));
  const [removedExistingIds, setRemovedExistingIds] = useState<number[]>([]);
  const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailTouched, setDetailTouched] = useState(false);

  function updateTurkeySpecific<K extends keyof typeof turkeySpecific>(key: K, value: typeof turkeySpecific[K]) {
    setTurkeySpecific((prev) => ({ ...prev, [key]: value }));
  }

  const isEscooter   = categorySlug === "e-scooter";
  const isEbisiklet  = categorySlug === "e-bisiklet";
  const isEV         = fuelType === "EV" || isEscooter;
  const isCombustion = !isEV && ["GASOLINE", "DIESEL", "HYBRID"].includes(fuelType ?? "");
  const isGasoline   = fuelType === "GASOLINE";

  const detailValidation = validateDetailShort(detailText);
  const prosError = pros.length < 1 ? true : pros.length > 3;
  const consError = cons.length < 1 ? true : cons.length > 3;
  const canSubmit = !prosError && !consError && detailValidation.ok;

  function togglePro(key: string) {
    setPros((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }
  function toggleCon(key: string) {
    setCons((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }
  function toggleRemoveExisting(id: number) {
    setRemovedExistingIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }

  function goToProduct() {
    router.push(`/araclar/${productSlug}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const extendedData = buildExtendedData(turkeySpecific, { isCombustion, isGasoline, isEV, isEscooter, isEbisiklet });

    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pros, cons, detailText,
        wouldBuyAgain: wouldRecommend === "yes" ? true : wouldRecommend === "no" ? false : null,
        scoreFiyat, scoreKalite, scorePerformans,
        ownershipMonths: OWNERSHIP_MONTHS[ownershipSlot] ?? null,
        extendedData,
        photoUrls: newPhotoUrls,
        removePhotoIds: removedExistingIds,
        triggerSource: "REMINDER_3M",
      }),
    });

    if (res.ok) {
      router.push(`/araclar/${productSlug}`);
      router.refresh();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Bir hata oluştu.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* FI·KA·PE Puanları */}
      <SectionCard step={1} title="FI·KA·PE Puanları" badge="required">
        {FIKAPE.map(({ key, short, label, color, bg }) => (
          <ScoreSelector
            key={key} short={short} label={label} color={color} bg={bg}
            value={key === "scoreFiyat" ? scoreFiyat : key === "scoreKalite" ? scoreKalite : scorePerformans}
            initialValue={key === "scoreFiyat" ? initialScoreFiyat : key === "scoreKalite" ? initialScoreKalite : initialScorePerformans}
            onChange={key === "scoreFiyat" ? setScoreFiyat : key === "scoreKalite" ? setScoreKalite : setScorePerformans}
          />
        ))}
      </SectionCard>

      {/* Artılar & Eksiler */}
      <SectionCard step={2} title="Artılar & Eksiler" badge="required">
        <ProConChipSelector chips={chips} pros={pros} cons={cons} onTogglePro={togglePro} onToggleCon={toggleCon} />
        {(pros.length < 1 || cons.length < 1) && (
          <p className="text-xs text-red-500">Her bölümden en az 1 seçin.</p>
        )}

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">
              Yorumun <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </p>
            <span className={`text-xs ${detailText.length >= 460 ? "text-orange-400" : "text-gray-400"}`}>
              {detailText.length}/500
            </span>
          </div>
          <textarea
            value={detailText}
            onChange={(e) => setDetailText(e.target.value.slice(0, 500))}
            onBlur={() => { if (detailText.trim()) setDetailTouched(true); }}
            rows={4}
            placeholder="Deneyimini birkaç cümleyle anlat..."
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none resize-none transition-colors"
            style={{ borderColor: detailTouched ? (detailValidation.ok ? "#86efac" : "#fca5a5") : "#e5e7eb" }}
          />
          {detailTouched && !detailValidation.ok && <FieldFeedback error={detailValidation.error} ok={false} />}
        </div>

        <PhotoUploader
          existingPhotos={initialPhotos}
          removedExistingIds={removedExistingIds}
          onToggleRemoveExisting={toggleRemoveExisting}
          newPhotoUrls={newPhotoUrls}
          onNewPhotoUrlsChange={setNewPhotoUrls}
        />
      </SectionCard>

      {/* Sahiplik & Kullanım */}
      <SectionCard step={3} title="Sahiplik & Kullanım" badge="optional">
        <OwnershipUsageSection
          isEbisiklet={isEbisiklet}
          ownershipSlot={ownershipSlot}
          onOwnershipSlotChange={setOwnershipSlot}
          usageType={turkeySpecific.usageType}
          onUsageTypeChange={(v) => updateTurkeySpecific("usageType", v)}
          wouldRecommend={wouldRecommend}
          onWouldRecommendChange={setWouldRecommend}
        />
      </SectionCard>

      {/* Türkiye'ye Özel */}
      <SectionCard step={4} title="Türkiye'ye özel" badge="conditional">
        <p className="text-xs text-gray-400 -mt-2">Araç tipine göre sorular otomatik değişir. Hepsi opsiyoneldir.</p>
        <TurkeySpecificSection
          isCombustion={isCombustion}
          isGasoline={isGasoline}
          isEV={isEV}
          isEscooter={isEscooter}
          isEbisiklet={isEbisiklet}
          values={turkeySpecific}
          onChange={updateTurkeySpecific}
        />
      </SectionCard>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <div className="space-y-2">
        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
          style={{ background: "#111" }}
        >
          {submitting ? "Kaydediliyor..." : "Güncelle"}
        </button>
        <button
          type="button"
          onClick={goToProduct}
          className="w-full py-3 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Görüşüm değişmedi
        </button>
      </div>
    </form>
  );
}
