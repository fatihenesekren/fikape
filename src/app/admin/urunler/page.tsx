import { prisma } from "@/lib/prisma";
import { UrunlerClient } from "./UrunlerClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Teknik Özellikler — Admin", robots: { index: false } };

export default async function AdminUrunlerPage() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { brand: true, model: true, category: true },
    orderBy: [{ category: { name: "asc" } }, { brand: { name: "asc" } }, { year: "desc" }],
  });

  const mapped = products.map((p) => ({
    slug: p.slug,
    name: `${p.brand.name} ${p.model.name}${p.trimName ? ` ${p.trimName}` : ""}${p.year ? ` ${p.year}` : ""}`,
    categorySlug: p.category?.slug ?? "",
    categoryName: p.category?.name ?? "",
    attributes: (typeof p.attributes === "object" && p.attributes !== null ? p.attributes : {}) as Record<string, unknown>,
  }));

  return (
    <div className="px-8 py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Teknik Özellikler</h1>
        <p className="text-sm text-gray-500">
          {mapped.length} araç — her satırı açıp motor, kasa, güç gibi teknik özellikleri gir.
        </p>
      </div>

      <UrunlerClient products={mapped} />
    </div>
  );
}
