import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tradeListingCreateSchema, formatZodError } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rateLimit";
import { isTradeListingEnabled } from "@/lib/features";

const DAILY_LISTING_LIMIT = Number(process.env.TAKASA_AC_ILAN_GUNLUK_LIMIT) || 5;

export async function POST(req: Request) {
  if (!isTradeListingEnabled()) {
    return NextResponse.json({ error: "Bu özellik geçici olarak kapalı." }, { status: 503 });
  }

  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const userId = Number(session.user.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trustLevel: true, isBanned: true },
  });
  if (!user || user.isBanned) {
    return NextResponse.json({ error: "Bu işlemi gerçekleştiremezsiniz." }, { status: 403 });
  }
  if (user.trustLevel < 3) {
    return NextResponse.json(
      { error: "Takasa açmak için garajınızda fotoğraflı, onaylanmış bir yorumunuz olması gerekiyor." },
      { status: 403 }
    );
  }

  const parsed = tradeListingCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { wantAnything, note, paymentIntent, city } = parsed.data;
  const userProductId = Number(parsed.data.userProductId);
  const wantCategoryId = parsed.data.wantCategoryId != null ? Number(parsed.data.wantCategoryId) : null;
  const wantBrandId = parsed.data.wantBrandId != null ? Number(parsed.data.wantBrandId) : null;

  const userProduct = await prisma.userProduct.findUnique({
    where: { id: userProductId },
    select: { id: true, userId: true, productId: true, ownershipStatus: true },
  });
  if (!userProduct || userProduct.userId !== userId || userProduct.ownershipStatus !== "CURRENT") {
    return NextResponse.json({ error: "Bu araç garajınızda değil." }, { status: 404 });
  }

  const existing = await prisma.tradeListing.findFirst({
    where: { userProductId, isActive: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Bu araç için zaten aktif bir takas ilanınız var." }, { status: 409 });
  }

  if (!checkRateLimit(`trade-create:${userId}`, DAILY_LISTING_LIMIT, 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Günlük ilan açma sınırına ulaştınız, yarın tekrar deneyiniz." }, { status: 429 });
  }

  try {
    const listing = await prisma.tradeListing.create({
      data: {
        userId,
        productId: userProduct.productId,
        userProductId,
        wantCategoryId,
        wantBrandId,
        wantAnything: wantAnything ?? false,
        note: note ?? null,
        paymentIntent,
        city,
      },
    });
    return NextResponse.json({ ok: true, id: listing.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bu araç için zaten aktif bir takas ilanınız var." }, { status: 409 });
  }
}
