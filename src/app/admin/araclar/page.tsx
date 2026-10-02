import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ImageManager } from "./ImageManager";
import { commonsDosyaAdi, krediDogrula } from "@/lib/gorselKredisi";

export const metadata = { title: "Araç Görselleri — Admin" };

export default async function AdminAraclarPage({
  searchParams,
}: {
  searchParams: Promise<{ eksik?: string }>;
}) {
  const { eksik } = await searchParams;

  const products = await prisma.product.findMany({
    // REJECTED öneri ürünleri "görselsiz" gürültüsü yaratmasın; PENDING'ler de
    // onaylanana kadar görsel yönetimine girmesin
    where: { status: "ACTIVE" },
    include: { brand: true, model: true, category: true },
    orderBy: [{ category: { name: "asc" } }, { brand: { name: "asc" } }, { year: "desc" }],
  });

  const mapped = products.map((p) => ({
    slug:     p.slug,
    name:     `${p.brand.name} ${p.model.name}${p.trimName ? ` ${p.trimName}` : ""}${p.year ? ` ${p.year}` : ""} — ${p.category?.name ?? ""}`,
    imageUrl: p.imageUrl,
    // Atıf durumu: kayıtlı (elle/otomatik) ya da Commons adresinden canlı okunur; aksi halde eksik
    kredi: krediDogrula(p.imageCredit),
    atifOtomatik: !krediDogrula(p.imageCredit) && !!commonsDosyaAdi(p.imageUrl),
  }));

  const missing = mapped.filter((p) => !p.imageUrl).length;
  const atifEksik = mapped.filter((p) => p.imageUrl && !p.kredi && !p.atifOtomatik).length;

  return (
    <div className="px-4 sm:px-8 py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Araç Görselleri</h1>
        <p className="text-sm text-gray-500">
          {mapped.length} araç — {missing > 0 ? (
            <Link href="/admin/araclar?eksik=1" className="text-orange-600 font-semibold hover:underline">
              {missing} görselsiz
            </Link>
          ) : (
            <span className="text-green-600 font-semibold">tümü tamamlanmış</span>
          )}
        </p>
        {atifEksik > 0 && (
          <p className="text-sm text-amber-700 mt-1">{atifEksik} görselde yazar/lisans bilgisi eksik — “Atıf eksik” filtresiyle bulup girin.</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          URL: doğrudan Wikipedia Commons, basın kit veya Vercel Blob URL. Dosya: yüklenip otomatik blob&apos;a kaydedilir.
        </p>
      </div>

      <ImageManager products={mapped} initialOnlyMissing={eksik === "1"} />
    </div>
  );
}
