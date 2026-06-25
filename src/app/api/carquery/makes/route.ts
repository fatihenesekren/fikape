import { NextResponse } from "next/server";

const CQ = "https://www.carqueryapi.com/api/0.3/";

export async function GET() {
  const res = await fetch(`${CQ}?cmd=getMakes`, { next: { revalidate: 86400 } });
  if (!res.ok) return NextResponse.json({ makes: [] });

  const data = await res.json();
  const makes: { make_id: string; make_display: string; make_country: string }[] =
    data.Makes ?? [];

  return NextResponse.json({ makes });
}
