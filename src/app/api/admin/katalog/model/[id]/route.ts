import { NextResponse } from "next/server";
import { adminIstek } from "@/lib/adminIstek";
import { pozitifTamsayiId } from "@/lib/validateId";
import { modelSilSema, zodMesaji } from "@/lib/katalog/urunDogrula";
import { modelSil } from "@/lib/katalog/markaModelServis";
import { katalogOnbellekTemizle } from "@/lib/katalog/yonetim";
import { hataYaniti, jsonGovde } from "@/lib/katalog/rotaYardimci";

// Boş modeli siler (bağlı kayıt varsa 409). Yapısal işlem: günde en çok 5 (yeniden adlandırma/birleştirme ile ortak)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const k = await adminIstek(req, { anahtar: "yapisal", adet: 5, pencereMs: 24 * 60 * 60 * 1000 });
  if ("hata" in k) return k.hata;
  const id = pozitifTamsayiId((await params).id);
  if (id === null) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const girdi = modelSilSema.safeParse(await jsonGovde(req));
  if (!girdi.success) return NextResponse.json({ error: zodMesaji(girdi.error) }, { status: 422 });
  try {
    const sonuc = await modelSil(k.admin, id, girdi.data.beklenenAd);
    katalogOnbellekTemizle();
    return NextResponse.json(sonuc);
  } catch (e) {
    return hataYaniti(e);
  }
}
