import { NextResponse } from "next/server";
import { auth } from "@/auth";

// BlurEditor tuvale (canvas) çizim yapabilmek için görseli piksel bazında okuyor
// (getImageData). Görsel farklı bir origin'den (Wikimedia Commons, basın kiti vb.)
// geliyorsa ve o sunucu CORS header'ı döndürmüyorsa tarayıcı tuvali "kirlenmiş"
// sayıp okumayı reddediyor — img.onload hiç tetiklenmiyor, "Yükleniyor..." sonsuza
// kadar takılı kalıyor. Çözüm: görseli sunucu tarafında bu route üzerinden çekip
// kendi origin'imizden servis etmek (CORS sorunu tamamen ortadan kalkıyor).
export async function GET(req: Request) {
  const session = await auth();
  if (!session || Number(session.user.trustLevel) < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const url = new URL(req.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url gerekli." }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "Geçersiz URL." }, { status: 400 });
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return NextResponse.json({ error: "Geçersiz protokol." }, { status: 400 });
  }

  try {
    const upstream = await fetch(target, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "fikape-image-proxy/1.0" },
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: `Kaynak yanıt vermedi (${upstream.status}).` }, { status: 502 });
    }
    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Kaynak bir görsel değil." }, { status: 415 });
    }
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Görsel alınamadı." }, { status: 502 });
  }
}
