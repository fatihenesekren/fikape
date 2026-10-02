import { NextResponse } from "next/server";
import { adminIstek } from "@/lib/adminIstek";
import { pozitifTamsayiId } from "@/lib/validateId";
import { durumSema, zodMesaji } from "@/lib/katalog/urunDogrula";
import { aracDurumDegistir } from "@/lib/katalog/urunServis";
import { katalogOnbellekTemizle } from "@/lib/katalog/yonetim";
import { hataYaniti, jsonGovde } from "@/lib/katalog/rotaYardimci";

// Pasife alma (katalogdan kaldır) ve geri alma
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const k = await adminIstek(req, { anahtar: "yazma", adet: 30, pencereMs: 60_000 });
  if ("hata" in k) return k.hata;
  const id = pozitifTamsayiId((await params).id);
  if (id === null) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const girdi = durumSema.safeParse(await jsonGovde(req));
  if (!girdi.success) return NextResponse.json({ error: zodMesaji(girdi.error) }, { status: 422 });
  try {
    const sonuc = await aracDurumDegistir(k.admin, id, girdi.data.islem, girdi.data.neden ?? null);
    katalogOnbellekTemizle();
    return NextResponse.json(sonuc);
  } catch (e) {
    return hataYaniti(e);
  }
}
