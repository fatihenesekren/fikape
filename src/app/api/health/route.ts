import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

// Dış izleme (UptimeRobot vb.) için sağlık ucu: veritabanına ulaşılabiliyorsa 200,
// değilse 503. Ayrıntı sızdırmaz — yalnızca genel durum döner.
export async function GET() {
  const basliklar = { "Cache-Control": "no-store" };
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, rej) => setTimeout(() => rej(new Error("db zaman aşımı")), 8000)),
    ]);
    return NextResponse.json({ ok: true }, { headers: basliklar });
  } catch (e) {
    console.error("[health] veritabanı erişilemiyor:", e);
    return NextResponse.json({ ok: false }, { status: 503, headers: basliklar });
  }
}
