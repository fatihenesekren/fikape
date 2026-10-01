import { NextResponse } from "next/server";
import { ekKategoriGecerli, getEkMarka, getEkMarkalar, getEkTum, markaSlug } from "@/lib/katalog/ekSunucu";

export const runtime = "nodejs";

// Herkese açık: yalnız ONAYLI (ACTIVE) araçların marka/model/versiyon/donanım bilgisi — zaten sitede görünen veri.
// ?kategori=otomobil&marka=BMW  → o markanın onaylı araçları
// ?kategori=karavan&tum=1       → statik kataloğu olmayan kategorilerde tüm markalar
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const kategori = sp.get("kategori") ?? "";
  if (!ekKategoriGecerli(kategori)) return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });
  const cache = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" };
  try {
    if (sp.get("tum") === "1") {
      return NextResponse.json({ markalar: await getEkTum(kategori) }, { headers: cache });
    }
    const marka = (sp.get("marka") ?? "").trim();
    if (!marka || marka.length > 80) return NextResponse.json({ error: "Marka gerekli" }, { status: 400 });
    const slug = markaSlug(marka);
    if (!slug) return NextResponse.json({ marka: null }, { headers: cache });
    // Önbellek anahtarı kümesi = gerçek (onaylı ürünü olan) markalar: rastgele ?marka= değerleriyle sınırsız
    // önbellek girdisi/DB sorgusu üretilemez.
    const gecerli = (await getEkMarkalar(kategori)).some((ad) => markaSlug(ad) === slug);
    if (!gecerli) return NextResponse.json({ marka: null }, { headers: cache });
    return NextResponse.json({ marka: await getEkMarka(kategori, slug) }, { headers: cache });
  } catch (e) {
    console.error("[GET /api/katalog/ek]", e);
    return NextResponse.json({ error: "Katalog eklemeleri alınamadı" }, { status: 500 });
  }
}
