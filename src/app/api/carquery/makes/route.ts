import { NextResponse } from "next/server";

const CQ = "https://www.carqueryapi.com/api/0.3/";

export async function GET() {
  try {
    const res = await fetch(`${CQ}?cmd=getMakes`, { next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.json({ makes: [] });

    // CarQuery yanıtı bazen ";{...}" şeklinde gelir — parse öncesi temizle
    const text = await res.text();
    const json = text.trim().replace(/^[^[{]*/, "");
    const data = JSON.parse(json);

    const makes: { make_id: string; make_display: string; make_country: string }[] =
      data.Makes ?? [];

    return NextResponse.json({ makes });
  } catch {
    return NextResponse.json({ makes: [] });
  }
}
