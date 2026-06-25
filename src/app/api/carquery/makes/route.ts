import { NextResponse } from "next/server";
import vehiclesData from "@/data/vehicles.json";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "otomobil";

  const list = vehiclesData[category as keyof typeof vehiclesData] ?? vehiclesData.otomobil;

  // { make_id, make_display } formatı (geriye dönük uyumluluk)
  const makes = list.map((m) => ({
    make_id: m.make.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    make_display: m.make,
  }));

  return NextResponse.json({ makes });
}
