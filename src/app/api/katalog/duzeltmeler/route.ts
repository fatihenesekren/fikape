import { NextResponse } from "next/server";
import { ekKategoriGecerli } from "@/lib/katalog/ekSunucu";
import { getGizliKayitlar } from "@/lib/katalog/overrideSunucu";

export const runtime = "nodejs";

// Herkese açık: resmi katalogdan gizlenen marka/model/versiyon anahtarları (formlar bunları listeden çıkarır).
export async function GET(req: Request) {
  const kategori = new URL(req.url).searchParams.get("kategori") ?? "";
  if (!ekKategoriGecerli(kategori)) return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });
  try {
    return NextResponse.json(
      { gizli: await getGizliKayitlar(kategori) },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
    );
  } catch (e) {
    console.error("[GET /api/katalog/duzeltmeler]", e);
    return NextResponse.json({ error: "Düzeltmeler alınamadı" }, { status: 500 });
  }
}
