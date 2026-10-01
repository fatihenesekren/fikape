import { guvenliGorselIndir, GorselIndirmeHatasi } from "@/lib/guvenliGorselIndir";
import { NextResponse } from "next/server";
import { adminOturumu } from "@/lib/adminAuth";

// BlurEditor tuvale (canvas) çizim yapabilmek için görseli piksel bazında okuyor
// (getImageData). Görsel farklı bir origin'den (Wikimedia Commons, basın kiti vb.)
// geliyorsa ve o sunucu CORS header'ı döndürmüyorsa tarayıcı tuvali "kirlenmiş"
// sayıp okumayı reddediyor — img.onload hiç tetiklenmiyor, "Yükleniyor..." sonsuza
// kadar takılı kalıyor. Çözüm: görseli sunucu tarafında bu route üzerinden çekip
// kendi origin'imizden servis etmek (CORS sorunu tamamen ortadan kalkıyor).
export async function GET(req: Request) {
  const admin = await adminOturumu();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const url = new URL(req.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url gerekli." }, { status: 400 });
  }

  try {
    // İç ağ/özel IP engeli, yönlendirme denetimi, boyut sınırı ve yalnız raster görsel türleri (SVG/HTML sunulmaz).
    const { buffer, contentType } = await guvenliGorselIndir(url, { maxBayt: 15 * 1024 * 1024 });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (e) {
    if (e instanceof GorselIndirmeHatasi) {
      const durum = e.kod === "gorsel-degil" ? 415 : e.kod === "gecersiz-adres" || e.kod === "guvensiz-hedef" ? 400 : e.kod === "cok-buyuk" ? 413 : 502;
      return NextResponse.json({ error: e.message }, { status: durum });
    }
    return NextResponse.json({ error: "Görsel alınamadı." }, { status: 502 });
  }
}
