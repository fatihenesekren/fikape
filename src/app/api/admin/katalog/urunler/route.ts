import { NextResponse, after } from "next/server";
import { adminIstek } from "@/lib/adminIstek";
import { aracEkleSema, zodMesaji } from "@/lib/katalog/urunDogrula";
import { aracEkle } from "@/lib/katalog/urunServis";
import { katalogOnbellekTemizle } from "@/lib/katalog/yonetim";
import { hataYaniti, jsonGovde } from "@/lib/katalog/rotaYardimci";
import { notifyGarageBrandFollowers } from "@/lib/notifications";

// Doğrudan araç ekleme (öneri/onay beklemeden ACTIVE). Garaj takipçisi bildirimi varsayılan KAPALI.
export async function POST(req: Request) {
  const k = await adminIstek(req, { anahtar: "yazma", adet: 30, pencereMs: 60_000 });
  if ("hata" in k) return k.hata;
  const girdi = aracEkleSema.safeParse(await jsonGovde(req));
  if (!girdi.success) return NextResponse.json({ error: zodMesaji(girdi.error) }, { status: 422 });
  try {
    const sonuc = await aracEkle(k.admin, girdi.data);
    katalogOnbellekTemizle();
    if (girdi.data.bildirimGonder) {
      // İstek süresini bloklamadan, commit'ten sonra
      after(async () => { await notifyGarageBrandFollowers(sonuc.id); });
    }
    return NextResponse.json(sonuc, { status: 201 });
  } catch (e) {
    return hataYaniti(e);
  }
}
