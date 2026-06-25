import { NextResponse } from "next/server";

const CQ = "https://www.carqueryapi.com/api/0.3/";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get("make")?.trim();

  if (!make) return NextResponse.json({ models: [] });

  try {
    const res = await fetch(`${CQ}?cmd=getModels&make=${encodeURIComponent(make)}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ models: [] });

    const text = await res.text();
    const json = text.trim().replace(/^[^[{]*/, "");
    const data = JSON.parse(json);
    const models: { model_name: string; model_make_id: string }[] = data.Models ?? [];

    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ models: [] });
  }
}
