import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isoWeekWindow } from "@/lib/reports/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sıfırlamadan HEMEN ÖNCE haftalık görüntülenmeleri anlık görüntüye al —
  // haftalık admin raporu (Pzt 05:00) bunu okur. weekStart = az önce biten
  // haftanın başı (geçen Pazartesi 00:00 UTC); rapor cron'u aynı pencereyi hesaplar.
  // ON CONFLICT DO NOTHING → cron retry'ında ikinci kez yazılmaz (idempotent).
  const weekStart = isoWeekWindow().weekStart;

  const [snapshot, result] = await prisma.$transaction([
    prisma.$executeRaw`
      INSERT INTO "weekly_view_snapshots" ("weekStart", "productId", "weeklyViews", "lifetimeViews")
      SELECT ${weekStart}, "id", "weeklyViewCount", "viewCount"
      FROM "products"
      WHERE "weeklyViewCount" > 0
      ON CONFLICT ("weekStart", "productId") DO NOTHING`,
    prisma.product.updateMany({ data: { weeklyViewCount: 0 } }),
  ]);

  return NextResponse.json({
    ok: true,
    snapshotRows: snapshot,
    weekStart: weekStart.toISOString(),
    reset: result.count,
    resetAt: new Date().toISOString(),
  });
}
