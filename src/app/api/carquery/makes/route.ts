import { NextResponse } from "next/server";
import makesData from "@/data/makes.json";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "otomobil";

  const list = makesData[category as keyof typeof makesData] ?? makesData.otomobil;

  // Eski format ile uyumluluk: { make_id, make_display }
  const makes = list.map((name) => ({
    make_id: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    make_display: name,
  }));

  return NextResponse.json({ makes });
}
