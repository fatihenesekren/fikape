import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pozitifTamsayiId } from "@/lib/validateId";
import { trimParcala } from "@/lib/katalog/ek";
import { bagSayilari } from "@/lib/katalog/yonetim";
import { AltMenu } from "../AltMenu";
import { AracDetayClient } from "./AracDetayClient";

export const metadata = { title: "Araç — Katalog Yönetimi" };
export const dynamic = "force-dynamic";

export default async function AracDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const id = pozitifTamsayiId((await params).id);
  if (id === null) notFound();
  const p = await prisma.product.findUnique({
    where: { id },
    include: { brand: true, model: true, category: { select: { slug: true } } },
  });
  if (!p) notFound();
  const bag = await prisma.$transaction((tx) => bagSayilari(tx, id));
  const t = trimParcala(p.trimName);
  const attr = (p.attributes && typeof p.attributes === "object" && !Array.isArray(p.attributes) ? p.attributes : {}) as Record<string, unknown>;

  return (
    <div className="px-4 sm:px-8 py-10 max-w-2xl">
      <AltMenu aktif="" />
      <Link href="/admin/katalog" className="text-sm text-gray-500 hover:underline">← Listeye dön</Link>
      <AracDetayClient
        urun={{
          id: p.id, slug: p.slug, name: p.name, status: p.status, isActive: p.isActive,
          kategori: p.category?.slug ?? "otomobil",
          marka: p.brand.name, model: p.model.name, versiyon: t.v || "", paket: t.p ?? "",
          yil: p.year, yakit: typeof attr.fuel_type === "string" ? attr.fuel_type : "", vites: typeof attr.transmission === "string" ? attr.transmission : "",
          guncelleme: p.updatedAt.toISOString(),
        }}
        bag={bag}
      />
    </div>
  );
}
