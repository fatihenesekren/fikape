import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 5651 sayılı Kanun m.5: trafik bilgisi 1 yıldan az, 2 yıldan fazla olmamak
// üzere saklanır. Üst sınır (2 yıl) seçildi — bkz. prisma/schema.prisma
// AccessLog notu. Bu iş sessizce başarısız olursa saklama süresi taahhüdü
// aşılabilir (tablo süresiz büyür), bu yüzden hata mutlaka loglanır.
const RETENTION_MS = 2 * 365 * 24 * 60 * 60 * 1000; // 2 yıl

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - RETENTION_MS);
    const result = await prisma.accessLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    return NextResponse.json({ ok: true, deleted: result.count, cutoff: cutoff.toISOString() });
  } catch (err) {
    console.error("cleanup-access-logs failed:", err);
    return NextResponse.json({ error: "Temizlik başarısız oldu." }, { status: 500 });
  }
}
