import { NextResponse } from "next/server";

const CQ = "https://www.carqueryapi.com/api/0.3/";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").toLowerCase().trim();

  const res = await fetch(`${CQ}?cmd=getMakes`, { next: { revalidate: 86400 } });
  if (!res.ok) return NextResponse.json({ makes: [] });

  const data = await res.json();
  const makes: { make_id: string; make_display: string; make_country: string }[] =
    data.Makes ?? [];

  const filtered = q
    ? makes.filter((m) => m.make_display.toLowerCase().startsWith(q))
    : makes.slice(0, 20);

  return NextResponse.json({ makes: filtered.slice(0, 30) });
}
