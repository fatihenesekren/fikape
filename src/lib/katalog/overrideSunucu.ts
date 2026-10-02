import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { EK_ETIKET, type EkKategori } from "@/lib/katalog/ekSunucu";
import type { GizliKayit, OverrideScope } from "@/lib/katalog/override";

/** Kategorideki aktif gizleme kayıtları (herkese açık, anahtarlanmış biçim). Katalog önbelleğiyle birlikte temizlenir. */
export const getGizliKayitlar = unstable_cache(
  async (kategori: EkKategori): Promise<GizliKayit[]> => {
    const rows = await prisma.catalogOverride.findMany({
      where: { kategori, isActive: true },
      select: { scope: true, brandKey: true, modelKey: true, versiyonKey: true, paketKey: true },
      take: 2000,
    });
    return rows.map((r) => ({ scope: r.scope as OverrideScope, b: r.brandKey, m: r.modelKey, v: r.versiyonKey, p: r.paketKey }));
  },
  ["katalog-gizli"],
  { tags: [EK_ETIKET], revalidate: 600 },
);
