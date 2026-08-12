import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Takas Talep Raporu — Admin", robots: { index: false } };

const PAYMENT_LABEL: Record<string, string> = {
  SWAP_ONLY: "Sadece takas (yakın değer)",
  PAYS_EXTRA: "Üstüne para verir",
  WANTS_EXTRA: "Üstüne para bekliyor",
};

// Takas talep verisi (il, istenen kategori/marka, ödeme niyeti) şu ana kadar sadece
// bire-bir eşleştirme için kullanılıyordu; agregatif bir görünümü hiç yoktu (bkz.
// denetim raporu — "kendi başına satılabilir bir pazar raporu ürünü olabilir").
// Bu ilk adım: admin-içi bir görünüm. Dışa açık/ücretli bir API-as-a-Product'a
// dönüştürmek ayrı bir ürün kararı gerektirir, kapsam dışı bırakıldı.
export default async function TakasTalepRaporuPage() {
  const [byCity, byPaymentIntent, byWantCategory, activeCount, totalCount] = await Promise.all([
    prisma.tradeListing.groupBy({
      by: ["city"],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: 15,
    }),
    prisma.tradeListing.groupBy({
      by: ["paymentIntent"],
      where: { isActive: true },
      _count: { _all: true },
    }),
    prisma.tradeListing.groupBy({
      by: ["wantCategoryId"],
      where: { isActive: true, wantCategoryId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { wantCategoryId: "desc" } },
      take: 10,
    }),
    prisma.tradeListing.count({ where: { isActive: true } }),
    prisma.tradeListing.count(),
  ]);

  const categoryIds = byWantCategory.map((c) => c.wantCategoryId).filter((id): id is number => id != null);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-black text-gray-900 mb-1">📊 Takas Talep Raporu</h1>
        <p className="text-sm text-gray-500">
          Aktif {activeCount} ilan (tüm zamanlar: {totalCount}). Anonim/agregatif — bireysel ilan bilgisi içermez.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">İle Göre Arz (en yoğun 15)</h2>
        {byCity.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz veri yok.</p>
        ) : (
          <div className="space-y-1.5">
            {byCity.map((row) => (
              <div key={row.city} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm">
                <span className="text-gray-700">{row.city}</span>
                <span className="font-bold text-gray-900">{row._count._all}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Ödeme Niyeti Dağılımı</h2>
        <div className="space-y-1.5">
          {byPaymentIntent.map((row) => (
            <div key={row.paymentIntent} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm">
              <span className="text-gray-700">{PAYMENT_LABEL[row.paymentIntent] ?? row.paymentIntent}</span>
              <span className="font-bold text-gray-900">{row._count._all}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">En Çok İstenen Kategoriler</h2>
        {byWantCategory.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz veri yok (kullanıcılar &quot;marka/kategori fark etmez&quot; seçmiş olabilir).</p>
        ) : (
          <div className="space-y-1.5">
            {byWantCategory.map((row) => (
              <div key={row.wantCategoryId} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm">
                <span className="text-gray-700">{categoryNameById.get(row.wantCategoryId!) ?? "Bilinmeyen"}</span>
                <span className="font-bold text-gray-900">{row._count._all}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
