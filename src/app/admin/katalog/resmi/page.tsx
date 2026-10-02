import { prisma } from "@/lib/prisma";
import katalogIndex from "@/data/katalogIndex.json";
import vehiclesData from "@/data/vehicles.json";
import type { KatalogIndex } from "@/lib/katalog/tipler";
import type { LegacyMake } from "@/lib/katalog/ek";
import { adAnahtar } from "@/lib/katalog/ek";
import { AltMenu } from "../AltMenu";
import { ResmiKatalogClient, type KatalogSecenek, type Kayit } from "./ResmiKatalogClient";

export const metadata = { title: "Resmi Katalog — Katalog Yönetimi" };
export const dynamic = "force-dynamic";

const INDEX = katalogIndex as KatalogIndex;
const LEGACY_KATEGORILER = ["e-scooter", "e-bisiklet", "karavan"] as const;
const DIGER = "Diğer";

export default async function ResmiKatalogPage() {
  const secenekler: Record<string, KatalogSecenek[]> = {};
  for (const kat of ["otomobil", "kamyonet", "motosiklet"] as const) {
    secenekler[kat] = INDEX[kat]
      .filter((m) => m.marka !== "Diğer / Bulamadım")
      .map((m) => ({ marka: m.marka, dosya: m.dosya, modeller: m.modeller.map((ad) => ({ ad, versiyonlar: [] as string[] })) }));
  }
  for (const kat of LEGACY_KATEGORILER) {
    const makes = (vehiclesData as unknown as Record<string, LegacyMake[]>)[kat] ?? [];
    secenekler[kat] = makes
      .filter((m) => m.make !== "Diğer / Bulamadım")
      .map((m) => ({
        marka: m.make, dosya: "",
        modeller: m.models.filter((mo) => mo.name !== DIGER).map((mo) => ({ ad: mo.name, versiyonlar: mo.versions.filter((v) => v !== DIGER) })),
      }));
  }

  const rows = await prisma.catalogOverride.findMany({ where: { isActive: true }, orderBy: { id: "desc" }, take: 500 });
  const kayitlar: Kayit[] = rows.map((r) => {
    const l = (r.labels ?? {}) as Record<string, string | null>;
    const marka = (secenekler[r.kategori] ?? []).find((m) => adAnahtar(m.marka) === r.brandKey);
    const model = marka?.modeller.find((mo) => adAnahtar(mo.ad) === r.modelKey);
    // Yetim: gizlenen marka/model resmi katalogda artık yok (katalog yeniden üretilmiş/adı değişmiş olabilir)
    const yetim = !marka || (r.scope !== "BRAND" && !model);
    return {
      id: r.id, kategori: r.kategori, scope: r.scope as Kayit["scope"],
      etiket: [l.marka, l.model, [l.versiyon, l.paket].filter(Boolean).join(" · ")].filter(Boolean).join(" / "),
      yetim,
    };
  });

  return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl">
      <AltMenu aktif="/admin/katalog/resmi" />
      <ResmiKatalogClient secenekler={secenekler} kayitlar={kayitlar} />
    </div>
  );
}
