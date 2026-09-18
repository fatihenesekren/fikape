import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { ComparePicker } from "./ComparePicker";
import { dedupeAndLimitSlugs } from "./loadCompareData";

export const metadata: Metadata = {
  title: "Araç Karşılaştır",
  description: "İki veya daha fazla aracı fikape kullanıcı puanlarına göre yan yana karşılaştır.",
};

export default async function CompareEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ urunler?: string }>;
}) {
  const { urunler } = await searchParams;

  // Eski `?urunler=slug1,slug2` query-string şeması artık SEO/paylaşım için daha
  // güçlü olan path-based `/karsilastir/slug1-vs-slug2`'ye kalıcı (308) yönlendiriliyor
  // — eski paylaşılmış/bookmark'lanmış linkler kırılmasın diye.
  if (urunler) {
    const slugs = dedupeAndLimitSlugs(urunler.split(","));
    if (slugs.length >= 2) {
      permanentRedirect(`/karsilastir/${slugs.join("-vs-")}`);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Ana sayfaya dön
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Araç Karşılaştır</h1>
      <p className="text-sm text-gray-400 mb-8">
        fikape kullanıcı yorumlarına dayalı, iki veya daha fazla aracı yan yana karşılaştır.
      </p>

      <ComparePicker initial={[]} />
    </div>
  );
}
