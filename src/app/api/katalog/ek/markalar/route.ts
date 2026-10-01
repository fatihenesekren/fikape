import { NextResponse } from "next/server";
import { ekKategoriGecerli, getEkMarkalar } from "@/lib/katalog/ekSunucu";

export const runtime = "nodejs";

// Herkese açık: kategoride onaylı aracı olan marka adları (statik katalogda olmayan markaları forma ekler).
export async function GET(req: Request) {
  const kategori = new URL(req.url).searchParams.get("kategori") ?? "";
  if (!ekKategoriGecerli(kategori)) return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });
  try {
    return NextResponse.json(
      { markalar: await getEkMarkalar(kategori) },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
    );
  } catch (e) {
    console.error("[GET /api/katalog/ek/markalar]", e);
    return NextResponse.json({ error: "Markalar alınamadı" }, { status: 500 });
  }
}
