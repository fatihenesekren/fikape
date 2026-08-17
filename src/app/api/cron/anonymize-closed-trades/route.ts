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

  // KVKK saklama süresi taahhüdüne bağlı bir iş — sessizce başarısız olursa fark
  // edilmeden 6 aylık taahhüt ihlal edilebilir (bkz. denetim raporu), bu yüzden
  // hata burada mutlaka loglanıyor.
  try {
    const cutoff = new Date(Date.now() - RETENTION_MS);

    // anonymizedAt:null ile idempotent hale getirildi — önceden mesaj metnindeki
    // placeholder'a bakarak (implicit) tekrarı önlüyordu, bu artık açık bir alan.
    const staleListings = await prisma.tradeListing.findMany({
      where: { isActive: false, closedAt: { lt: cutoff }, anonymizedAt: null },
      select: { id: true },
    });

    if (staleListings.length === 0) {
      return NextResponse.json({ ok: true, anonymized: 0 });
    }

    const listingIds = staleListings.map((l) => l.id);

    const [messageResult] = await prisma.$transaction([
      prisma.message.updateMany({
        where: {
          text: { not: "[Bu mesaj silinmiştir]" },
          thread: { tradeListingId: { in: listingIds } },
        },
        data: { text: "[Bu mesaj silinmiştir]" },
      }),
      // İlanın kendi serbest metinleri (note + description) de PII/kimliklendirici
      // bilgi taşıyabilir ("34 ABC 123 plakalı aracımı takas ederim" gibi) —
      // sadece mesaj metni değil, bunlar da temizleniyor.
      prisma.tradeListing.updateMany({
        where: { id: { in: listingIds } },
        data: { note: null, description: null, anonymizedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true, listings: staleListings.length, anonymized: messageResult.count });
  } catch (e) {
    console.error("[cron/anonymize-closed-trades] başarısız oldu:", e);
    return NextResponse.json({ error: "Anonimleştirme işlemi başarısız oldu." }, { status: 500 });
  }
}
