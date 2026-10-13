import type { ReactNode } from "react";
import { stripGenRangeAnywhere } from "@/lib/modelDisplay";
import { takasSonrakiAdim, type TakasAracUygunlugu } from "@/lib/takasUygunluk";
import type { takasIlanFormVerisi } from "@/lib/takasIlanVerisi";
import { TradeToggleCard } from "@/app/garajim/TradeToggleCard";
import { TakasSartKarti } from "@/app/garajim/TakasSartKarti";

type KartVerisi = Awaited<ReturnType<typeof takasIlanFormVerisi>>;

function Rozet({ ton, children }: { ton: "mavi" | "yesil" | "gri" | "amber"; children: ReactNode }) {
  const sinif = {
    mavi: "bg-link-soft text-link-deep border-link-line",
    yesil: "bg-[var(--ka-bg)] text-[var(--ka-color)] border-transparent",
    gri: "bg-gray-100 text-gray-700 border-gray-200",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
  }[ton];
  return <span className={`shrink-0 inline-flex items-center text-xs font-semibold rounded-full border px-2.5 py-1 ${sinif}`}>{children}</span>;
}

// İlanlarım sayfasında tek araç: araç adı + durum rozeti, altında ilan kartı (varsa/hazırsa) ya da şart kartı.
// Durum rozeti kartın kendi başlığıyla aynı bilgiyi tekrarlamasın diye yalnızca bu kartta gösterilir.
export function AracIlanKarti({ arac, kartVerisi, takasAcik }: { arac: TakasAracUygunlugu; kartVerisi: KartVerisi | null; takasAcik: boolean }) {
  const { uygunluk: u } = arac;
  const detay = kartVerisi?.listingByUserProductId.get(arac.userProductId) ?? null;
  const kartVar = arac.aktifIlanId != null || u.uygun;

  return (
    <article
      id={`arac-${arac.userProductId}`}
      tabIndex={-1}
      className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 scroll-mt-20 target:ring-2 target:ring-link-line focus:outline-none"
    >
      <header className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold text-gray-900 min-w-0 break-words">{stripGenRangeAnywhere(arac.productName)}</h2>
        {arac.aktifIlanId != null ? (
          <Rozet ton="mavi">Yayında</Rozet>
        ) : u.uygun ? (
          detay && !detay.isActive ? <Rozet ton="gri">Kapalı</Rozet> : <Rozet ton="yesil">Takasa hazır</Rozet>
        ) : (
          <Rozet ton="amber">Şartlar eksik</Rozet>
        )}
      </header>
      {kartVar && kartVerisi ? (
        <TradeToggleCard
          userProductId={arac.userProductId}
          canOpenTrade={u.uygun}
          takasAcik={takasAcik}
          sart={{ adimlar: u.adimlar, sonraki: takasSonrakiAdim(u, arac.productSlug) }}
          categories={kartVerisi.categories}
          brands={kartVerisi.brands}
          categoryBrandMap={kartVerisi.categoryBrandMap}
          existingListing={detay}
          currentUsageAmount={arac.km}
          productSlug={arac.productSlug}
          categorySlug={arac.categorySlug}
          baslangicAcik={arac.aktifIlanId != null}
          cerceveSiz
        />
      ) : (
        <TakasSartKarti adimlar={u.adimlar} sonraki={takasSonrakiAdim(u, arac.productSlug)} />
      )}
    </article>
  );
}
