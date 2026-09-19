import { NextResponse } from "next/server";
import { getMostReviewedByCategory } from "@/lib/dataCache";
import { rateLimitByIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const RATE_LIMIT_COUNT = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// /karsilastir'de kategori kilitlendikten sonra "Popüler" öneri şeridini o
// kategoriye güncellemek için — seçili araçlar hariç tutularak ilk 3 aday
// döndürülüyor (kullanıcı bir öneriyi seçince yerine aynı kategoriden başka
// bir aday gelsin diye, bkz. kullanıcı geri bildirimi).
export async function GET(req: Request) {
  if (!(await rateLimitByIp(req, "compare-suggestions", RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_MS))) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz yavaşlayın." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category")?.trim();
  if (!category) return NextResponse.json([]);

  const exclude = new Set(
    (searchParams.get("exclude") ?? "").split(",").map((s) => s.trim()).filter(Boolean)
  );

  const candidates = await getMostReviewedByCategory(category);
  const result = candidates.filter((c) => !exclude.has(c.slug)).slice(0, 3);
  return NextResponse.json(result);
}
