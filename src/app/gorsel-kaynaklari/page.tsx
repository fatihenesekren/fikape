import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { gorselKredisi } from "@/lib/gorselKredisi";
import { GorselKaynaklariListe } from "./GorselKaynaklariListe";
import type { KaynakSatir } from "@/lib/gorselKaynak";

export const metadata: Metadata = {
  title: "Görsel Kaynakları",
  description: "fikape araç katalogunda kullanılan fotoğrafların yazar ve lisans bilgileri.",
  alternates: { canonical: "/gorsel-kaynaklari" },
};
export const dynamic = "force-dynamic"; // DB okur (DB'siz build'i kırmamak için statik üretilmez)

// Atıf listesi her ziyarette yeniden hesaplanmasın (Commons sorguları dahil): 10 dk önbellek.
const satirlariGetir = unstable_cache(
  async (): Promise<KaynakSatir[]> => {
    const urunler = await prisma.product.findMany({
      where: { status: "ACTIVE", isActive: true, imageUrl: { not: null } },
      select: { slug: true, name: true, imageUrl: true, imageCredit: true, category: { select: { slug: true } }, brand: { select: { name: true } } },
      orderBy: { name: "asc" },
      take: 2000,
    });
    const hepsi = await Promise.all(urunler.map(async (u) => ({ u, kredi: await gorselKredisi(u.imageUrl, u.imageCredit) })));
    return hepsi.flatMap(({ u, kredi }) =>
      kredi && u.imageUrl
        ? [{
            slug: u.slug, ad: u.name, marka: u.brand.name, kategori: u.category.slug, imageUrl: u.imageUrl,
            yazar: kredi.yazar, kaynakUrl: kredi.kaynakUrl ?? null, lisans: kredi.lisans, lisansUrl: kredi.lisansUrl ?? null,
          }]
        : [],
    );
  },
  ["gorsel-kaynaklari-v1"],
  { revalidate: 600 },
);

export default async function GorselKaynaklariPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tek = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const satirlar = await satirlariGetir();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-2">Görsel Kaynakları</h1>
      <p className="text-sm text-gray-500 mb-4">
        Katalogdaki araç fotoğraflarının önemli bir kısmı Wikimedia Commons&apos;taki özgür lisanslı çalışmalardır. Yazarlarına ve lisanslarına
        aşağıdan ulaşabilirsiniz. Lisans koşulları gereği görseller küçültülmüş veya plaka/yüz bulanıklaştırılmış olabilir. Bir görselin hak sahibiyseniz{" "}
        <a href="#hak-sahibi" className="font-semibold underline">bildirim bölümüne</a> bakın.
      </p>

      <GorselKaynaklariListe
        satirlar={satirlar}
        baslangic={{ q: tek(sp.q).slice(0, 80), kategori: tek(sp.kategori).slice(0, 30), lisans: tek(sp.lisans).slice(0, 40) }}
      />

      <section id="hak-sahibi" className="mt-8 rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 scroll-mt-4">
        <h2 className="text-sm font-bold text-gray-900 mb-1">Hak sahibi bildirimi</h2>
        <p className="text-sm text-gray-600">
          Bir görselin hak sahibiyseniz ve görselin kaldırılmasını ya da atıf bilgisinin düzeltilmesini istiyorsanız{" "}
          <a href="mailto:info@fikape.com?subject=G%C3%B6rsel%20hak%20sahibi%20bildirimi" className="font-semibold underline">info@fikape.com</a>{" "}
          adresine yazın. Bildiriminizde ilgili aracın adresini ve görselin size ait olduğunu gösteren bilgiyi paylaşmanız, süreci hızlandırır. Bildirimleri
          inceleyip gerekli görseli kısa sürede kaldırır veya düzeltiriz.
        </p>
      </section>
    </main>
  );
}
