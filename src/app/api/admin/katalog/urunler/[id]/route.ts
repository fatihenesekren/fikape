import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { adminIstek } from "@/lib/adminIstek";
import { pozitifTamsayiId } from "@/lib/validateId";
import { aracDuzeltSema, silmeSema, zodMesaji } from "@/lib/katalog/urunDogrula";
import { aracDuzelt, aracSil } from "@/lib/katalog/urunServis";
import { katalogOnbellekTemizle } from "@/lib/katalog/yonetim";
import { hataYaniti, jsonGovde } from "@/lib/katalog/rotaYardimci";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const k = await adminIstek(req, { anahtar: "yazma", adet: 30, pencereMs: 60_000 });
  if ("hata" in k) return k.hata;
  const id = pozitifTamsayiId((await params).id);
  if (id === null) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const girdi = aracDuzeltSema.safeParse(await jsonGovde(req));
  if (!girdi.success) return NextResponse.json({ error: zodMesaji(girdi.error) }, { status: 422 });
  try {
    const sonuc = await aracDuzelt(k.admin, id, girdi.data);
    katalogOnbellekTemizle();
    return NextResponse.json(sonuc);
  } catch (e) {
    return hataYaniti(e);
  }
}

// Gerçek silme: yalnız bağsız araç; araç adresini (slug) yazarak onay; günde en çok 10
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const k = await adminIstek(req, { anahtar: "sil", adet: 10, pencereMs: 24 * 60 * 60 * 1000 });
  if ("hata" in k) return k.hata;
  const id = pozitifTamsayiId((await params).id);
  if (id === null) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const girdi = silmeSema.safeParse(await jsonGovde(req));
  if (!girdi.success) return NextResponse.json({ error: zodMesaji(girdi.error) }, { status: 422 });
  try {
    const sonuc = await aracSil(k.admin, id, girdi.data.onayMetni);
    katalogOnbellekTemizle();
    // Yalnız kendi Blob deposundaki ürün görseli temizlenir (best-effort; dış adreslere dokunulmaz)
    if (sonuc.imageUrl) {
      try {
        const u = new URL(sonuc.imageUrl);
        if (u.hostname.endsWith(".public.blob.vercel-storage.com")) await del(u.origin + u.pathname);
      } catch { /* görsel temizliği başarısızsa silme yine de geçerli */ }
    }
    return NextResponse.json({ ok: true, id: sonuc.id });
  } catch (e) {
    return hataYaniti(e);
  }
}
