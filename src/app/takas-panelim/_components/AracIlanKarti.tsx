import { stripGenRangeAnywhere } from "@/lib/modelDisplay";
import { takasSonrakiAdim, type TakasAracUygunlugu } from "@/lib/takasUygunluk";
import type { takasIlanFormVerisi } from "@/lib/takasIlanVerisi";
import { TradeToggleCard } from "@/app/garajim/TradeToggleCard";
import { TakasSartKarti } from "@/app/garajim/TakasSartKarti";

type KartVerisi = Awaited<ReturnType<typeof takasIlanFormVerisi>>;

// İlanlarım sayfasında tek araç: araç adı, altında ilan kartı (varsa/hazırsa) ya da şart kartı. Ayrı bir durum rozeti YOK:
// kart durumu zaten söylüyor ("Takasa açık", "Takasa Aç", "Takas ilanınız kapalı", "Takasa N adım kaldı"); rozet aynı bilgiyi
// tekrarlıyordu (kullanıcı geri bildirimi).
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
      <h2 className="text-base font-bold text-gray-900 min-w-0 break-words">{stripGenRangeAnywhere(arac.productName)}</h2>
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
