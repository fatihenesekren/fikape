import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RETENTION_MS = 183 * 24 * 60 * 60 * 1000; // ~6 ay

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_MS);

  const staleListings = await prisma.tradeListing.findMany({
    where: { isActive: false, closedAt: { lt: cutoff } },
    select: { id: true },
  });

  if (staleListings.length === 0) {
    return NextResponse.json({ ok: true, anonymized: 0 });
  }

  const result = await prisma.message.updateMany({
    where: {
      text: { not: "[Bu mesaj silinmiştir]" },
      thread: { tradeListingId: { in: staleListings.map((l) => l.id) } },
    },
    data: { text: "[Bu mesaj silinmiştir]" },
  });

  return NextResponse.json({ ok: true, listings: staleListings.length, anonymized: result.count });
}
