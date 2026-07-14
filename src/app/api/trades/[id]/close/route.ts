import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tradeListingCloseSchema, formatZodError } from "@/lib/schemas";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const listingId = parseInt(id);
  if (isNaN(listingId)) return NextResponse.json({ error: "Geçersiz ilan." }, { status: 400 });

  const userId = Number(session.user.id);

  const listing = await prisma.tradeListing.findUnique({
    where: { id: listingId },
    select: { id: true, userId: true },
  });
  if (!listing || listing.userId !== userId) {
    return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });
  }

  const parsed = tradeListingCloseSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  await prisma.tradeListing.update({
    where: { id: listingId },
    data: { isActive: false, closedAt: new Date(), closeReason: parsed.data.closeReason ?? null },
  });

  return NextResponse.json({ ok: true });
}
