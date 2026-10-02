import { prisma } from "@/lib/prisma";
import { AltMenu } from "../AltMenu";
import { MarkaModelClient } from "./MarkaModelClient";

export const metadata = { title: "Marka / Model — Katalog Yönetimi" };
export const dynamic = "force-dynamic";

export default async function MarkaModelPage() {
  const markalar = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, models: { orderBy: { name: "asc" }, select: { id: true, name: true, _count: { select: { products: true } } } } },
  });
  return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl">
      <AltMenu aktif="/admin/katalog/marka-model" />
      <MarkaModelClient
        markalar={markalar.map((b) => ({
          id: b.id, ad: b.name,
          modeller: b.models.map((m) => ({ id: m.id, ad: m.name, urunSayisi: m._count.products })),
        }))}
      />
    </div>
  );
}
