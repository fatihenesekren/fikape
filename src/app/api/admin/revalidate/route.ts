import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { adminIstek } from "@/lib/adminIstek";
import { CACHE_ETIKETLERI, CACHE_KAPSAMI } from "@/lib/cacheEtiketleri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin "Cache Temizle": sayfa önbelleği + etiketli veri önbellekleri. Elle yapılan DB düzenlemeleri
// (betikler revalidateTag çağıramaz) ancak bu düğmeyle görünür olur. revalidatePath tek başına
// etiketli unstable_cache girdilerini garanti temizlemediği için etiketler açıkça geçersiz kılınır.
export async function POST(req: Request) {
  const kapi = await adminIstek(req, { anahtar: "cache-temizle", adet: 3, pencereMs: 60_000 });
  if ("hata" in kapi) return kapi.hata;

  try {
    revalidatePath("/", "layout");
    for (const etiket of CACHE_ETIKETLERI) revalidateTag(etiket, { expire: 0 });
  } catch (e) {
    console.error("[cache-temizle]", e);
    return NextResponse.json({ error: "Önbellek temizlenemedi." }, { status: 500 });
  }

  // Denetim kaydı temizlemeden SONRA: yazılamazsa temizleme yine de yapılmış olur, kullanıcıya hata gösterilmez.
  const zaman = new Date();
  let kayitYazildi = true;
  try {
    await prisma.catalogAuditLog.create({
      data: {
        adminId: kapi.admin.userId,
        adminLabel: kapi.admin.label,
        action: "CACHE_TEMIZLE",
        entityType: "SISTEM",
        entityLabel: "Site verisi önbelleği (sayfalar, vitrin, katalog, öneriler)",
        meta: { kapsam: [...CACHE_KAPSAMI], sonuc: "ok" },
      },
    });
  } catch (e) {
    kayitYazildi = false;
    console.error("[cache-temizle] denetim kaydı yazılamadı", e);
  }

  return NextResponse.json({ ok: true, zaman: zaman.toISOString(), yonetici: kapi.admin.label, kapsam: [...CACHE_KAPSAMI], kayitYazildi });
}
