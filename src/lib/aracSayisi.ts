import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ARAC_HAVUZU_ETIKETI } from "@/lib/cacheEtiketleri";

// Katalogdaki aktif araç sayısı (ana sayfa "Tüm araçlar" çağrısı için). Tek COUNT sorgusu, saatte en fazla bir kez;
// /araclar havuzuyla AYNI koşul (isActive) ve AYNI etiket — araç ekleme/pasife alma/düzeltme ve admin "Cache Temizle"
// bunu da temizler, yeni etiket gerekmez. Tüm havuzu (getAracHavuzu) yalnız sayı için çekmek gereksiz ağır olurdu.
export const getAktifAracSayisi = unstable_cache(
  () => prisma.product.count({ where: { isActive: true } }),
  ["aktif-arac-sayisi-v1"],
  { revalidate: 3600, tags: [ARAC_HAVUZU_ETIKETI] },
);
