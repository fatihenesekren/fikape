import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { messageReportSchema, formatZodError } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rateLimit";
import { isTradeListingEnabled } from "@/lib/features";

// İlanın kendisini (fotoğraf, içerik, sahte/spam ilan şüphesi) hedefleyen rapor —
// önceden sadece mesaj bazlı rapor mekanizması vardı (bkz. denetim raporu).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isTradeListingEnabled()) {
    return NextResponse.json({ error: "Bu özellik geçici olarak kapalı." }, { status: 503 });
  }

  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const listingId = parseInt(id);
  if (isNaN(listingId)) return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });

  const reporterId = Number(session.user.id);

  const listing = await prisma.tradeListing.findUnique({
    where: { id: listingId },
    select: { id: true, userId: true },
  });
  if (!listing) return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });
  if (listing.userId === reporterId) {
    return NextResponse.json({ error: "Kendi ilanınızı raporlayamazsınız." }, { status: 403 });
  }

  const parsed = messageReportSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  if (!checkRateLimit(`trade-listing-report:${reporterId}`, 5, 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Günlük rapor gönderme sınırına ulaştınız." }, { status: 429 });
  }

  const report = await prisma.tradeListingReport.create({
    data: {
      tradeListingId: listingId,
      reporterId,
      reason: parsed.data.reason,
      note: parsed.data.note ?? null,
    },
  });

  return NextResponse.json({ ok: true, id: report.id }, { status: 201 });
}
