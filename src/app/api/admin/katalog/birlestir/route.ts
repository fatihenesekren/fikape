import { NextResponse } from "next/server";
import { adminIstek } from "@/lib/adminIstek";
import { birlestirSema, zodMesaji } from "@/lib/katalog/urunDogrula";
import { birlestir, birlestirOnizle } from "@/lib/katalog/markaModelServis";
import { katalogOnbellekTemizle } from "@/lib/katalog/yonetim";
import { hataYaniti, jsonGovde } from "@/lib/katalog/rotaYardimci";

// Marka/model birleştirme: dryRun=true önizleme (yazmaz); gerçek işlem açık onay ister, günde en çok 5
export async function POST(req: Request) {
  const girdi = birlestirSema.safeParse(await jsonGovde(req));
  const onizleme = girdi.success ? girdi.data.dryRun : false;
  const k = await adminIstek(
    req,
    onizleme ? { anahtar: "onizleme", adet: 60, pencereMs: 60_000 } : { anahtar: "yapisal", adet: 5, pencereMs: 24 * 60 * 60 * 1000 },
  );
  if ("hata" in k) return k.hata;
  if (!girdi.success) return NextResponse.json({ error: zodMesaji(girdi.error) }, { status: 422 });
  const g = girdi.data;
  try {
    if (g.dryRun) return NextResponse.json({ onizleme: await birlestirOnizle(g.tur, g.kaynakId, g.hedefId) });
    if (!g.onay) {
      return NextResponse.json({ error: "Birleştirme geri alınamaz; önizlemeyi inceleyip açıkça onaylayın (onay: true)." }, { status: 422 });
    }
    const sonuc = await birlestir(k.admin, g.tur, g.kaynakId, g.hedefId);
    katalogOnbellekTemizle();
    return NextResponse.json({ ok: true, ...sonuc });
  } catch (e) {
    return hataYaniti(e);
  }
}
