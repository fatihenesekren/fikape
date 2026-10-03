import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { gorselKredisi } from "@/lib/gorselKredisi";

export const metadata: Metadata = {
  title: "Görsel Kaynakları",
  description: "fikape araç katalogunda kullanılan fotoğrafların yazar ve lisans bilgileri.",
  alternates: { canonical: "/gorsel-kaynaklari" },
};
export const dynamic = "force-dynamic"; // DB okur (DB'siz build'i kırmamak için statik üretilmez)

export default async function GorselKaynaklariPage() {
  const urunler = await prisma.product.findMany({
    where: { status: "ACTIVE", isActive: true, imageUrl: { not: null } },
    select: { slug: true, name: true, imageUrl: true, imageCredit: true },
    orderBy: { name: "asc" },
    take: 2000,
  });
  const satirlar = (
    await Promise.all(urunler.map(async (u) => ({ u, kredi: await gorselKredisi(u.imageUrl, u.imageCredit) })))
  ).filter((x) => x.kredi !== null);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-2">Görsel Kaynakları</h1>
      <p className="text-sm text-gray-500 mb-6">
        Katalogdaki araç fotoğraflarının önemli bir kısmı Wikimedia Commons&apos;taki özgür lisanslı çalışmalardır. Yazarlarına ve lisanslarına
        aşağıdan ulaşabilirsiniz. Lisans koşulları gereği görseller küçültülmüş veya plaka/yüz bulanıklaştırılmış olabilir.
      </p>
      <ul className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-xl">
        {satirlar.map(({ u, kredi }) => (
          <li key={u.slug} className="px-4 py-3 text-sm">
            <Link href={`/araclar/${u.slug}`} className="font-medium text-gray-900 hover:underline break-words">{u.name}</Link>
            <p className="text-xs text-gray-500 break-words">
              {kredi!.kaynakUrl ? <a href={kredi!.kaynakUrl} target="_blank" rel="noopener noreferrer" className="underline">{kredi!.yazar}</a> : kredi!.yazar}
              {" · "}
              {kredi!.lisansUrl ? <a href={kredi!.lisansUrl} target="_blank" rel="noopener noreferrer license" className="underline">{kredi!.lisans}</a> : kredi!.lisans}
            </p>
          </li>
        ))}
        {satirlar.length === 0 && <li className="px-4 py-8 text-sm text-gray-400 text-center">Henüz listelenecek kayıt yok.</li>}
      </ul>

      <section className="mt-8 rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
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
