import Link from "next/link";
import type { DecisionBadge } from "@/lib/compare/buildDecisionSummary";

// Rozetin kaynağı (gerçek kullanıcı yorumu vs teknik özellik) ikon+renkle
// ayrışıyor — sadece renge güvenmek yetersiz, ayrıca `title` ile ekran
// okuyucu/hover için sözel açıklama da taşınıyor.
const SOURCE_STYLES: Record<"review" | "spec", { bg: string; text: string; border: string; icon: string; hint: string }> = {
  review: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-100", icon: "★", hint: "Gerçek kullanıcı yorumlarına dayanıyor" },
  spec: { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-100", icon: "⚙", hint: "Teknik özelliğe dayanıyor" },
};

export function DecisionSummaryStrip({ badges }: { badges: DecisionBadge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="border border-gray-100 bg-gray-50/60 rounded-2xl px-4 py-3 mt-2 mb-2">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Öne çıkanlar</p>
      <div className="flex flex-wrap gap-2">
        {badges.map((b) =>
          b.source === "cta" ? (
            <Link
              key={b.label}
              href={b.href ?? "/yorum-yaz"}
              className="inline-flex flex-wrap max-w-full items-center gap-1.5 text-xs font-semibold bg-link-soft text-link border border-link-line rounded-full px-3 py-1.5 hover:bg-link-line transition-colors"
            >
              ✍️ {b.label} — ilk yorumu sen yaz →
            </Link>
          ) : (
            // flex-wrap + max-w-full ZORUNLU: inline-flex varsayılan olarak
            // flex-wrap:nowrap taşıyor, uzun araç adlarında (b.vehicleLabel)
            // pill içeriği satır kırmadan viewport dışına taşıp SAYFAYI
            // yatayda genişletiyordu (mobilde canlıda bulunan gerçek hata —
            // body'ye overflow-x-hidden eklemek bunu ÇÖZMEDİ çünkü bu gerçek
            // bir CSS taşmasıydı, tarayıcı viewport davranışı değil).
            <span
              key={b.label}
              title={SOURCE_STYLES[b.source].hint}
              className={`inline-flex flex-wrap max-w-full items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 border cursor-help ${SOURCE_STYLES[b.source].bg} ${SOURCE_STYLES[b.source].text} ${SOURCE_STYLES[b.source].border}`}
            >
              <span aria-hidden="true">{SOURCE_STYLES[b.source].icon}</span>
              {b.label}: <span className="font-bold">{b.vehicleLabel}</span>
              {b.detail && <span className="opacity-70 font-normal">· {b.detail}</span>}
            </span>
          )
        )}
      </div>
    </div>
  );
}
