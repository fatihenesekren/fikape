import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.product.updateMany({
    data: { weeklyViewCount: 0 },
  });

  return NextResponse.json({
    ok: true,
    reset: result.count,
    resetAt: new Date().toISOString(),
  });
}
