import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tradeListingUpdateSchema, formatZodError } from "@/lib/schemas";
import { isTradeListingEnabled } from "@/lib/features";
import { CAR_PARTS } from "@/lib/carParts";

// İlan düzenleme + yeniden açma — önceden ne düzenleme ne yeniden açma vardı,
// kullanıcı şehir/ödeme niyeti/notu değiştirmek için ilanı kapatıp sıfırdan
// açmak zorunda kalıyordu (bkz. denetim raporu).
export async function PATCH(
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
  if (isNaN(listingId)) return NextResponse.json({ error: "Geçersiz ilan." }, { status: 400 });

  const userId = Number(session.user.id);

  const listing = await prisma.tradeListing.findUnique({
    where: { id: listingId },
    select: { id: true, userId: true, userProductId: true, isActive: true, effectiveDate: true },
  });
  if (!listing || listing.userId !== userId) {
    return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });
  }

  const parsed = tradeListingUpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;

  // "İlan Yenile" — createdAt'a (ilanın gerçek açılış tarihi) dokunmadan
  // effectiveDate'i now()'a çekip listeleme sıralamasında öne alır. Kötüye
  // kullanımı önlemek için 48 saatlik cooldown (bkz. boşluk raporu, DÜŞÜK madde).
  const RENEW_COOLDOWN_MS = 48 * 60 * 60 * 1000;
  if (data.action === "renew") {
    if (!listing.isActive) {
      return NextResponse.json({ error: "Kapalı bir ilan yenilenemez." }, { status: 409 });
    }
    const nextEligible = new Date(listing.effectiveDate.getTime() + RENEW_COOLDOWN_MS);
    if (nextEligible > new Date()) {
      return NextResponse.json({
        error: `İlanınızı en erken ${nextEligible.toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} tarihinde yenileyebilirsiniz.`,
      }, { status: 429 });
    }
    await prisma.tradeListing.update({ where: { id: listingId }, data: { effectiveDate: new Date() } });
    return NextResponse.json({ ok: true });
  }

  if (data.action === "reopen") {
    if (listing.isActive) {
      return NextResponse.json({ error: "İlan zaten aktif." }, { status: 409 });
    }
    const existingActive = await prisma.tradeListing.findFirst({
      where: { userProductId: listing.userProductId, isActive: true },
      select: { id: true },
    });
    if (existingActive) {
      return NextResponse.json({ error: "Bu araç için zaten aktif bir takas ilanınız var." }, { status: 409 });
    }
    // Yeniden açılan ilan da fiilen yeni bir ilan gibi listeye dönüyor —
    // effectiveDate now()'a çekilir (createdAt yine dokunulmaz).
    await prisma.tradeListing.update({
      where: { id: listingId },
      data: { isActive: true, closedAt: null, closeReason: null, effectiveDate: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  // action === "update"
  if (!listing.isActive) {
    return NextResponse.json({ error: "Kapalı bir ilan düzenlenemez, önce yeniden açınız." }, { status: 409 });
  }

  const wantCategoryId = data.wantCategoryId != null ? Number(data.wantCategoryId) : null;
  const wantBrandId = data.wantBrandId != null ? Number(data.wantBrandId) : null;

  const validPartKeys = new Set(CAR_PARTS.map((p) => p.key));
  const partConditionEntries = Object.entries(data.partConditions ?? {}).filter(
    ([key]) => validPartKeys.has(key)
  );

  await prisma.$transaction([
    prisma.tradeListing.update({
      where: { id: listingId },
      data: {
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.paymentIntent !== undefined ? { paymentIntent: data.paymentIntent } : {}),
        ...(data.wantAnything !== undefined ? { wantAnything: data.wantAnything } : {}),
        wantCategoryId: data.wantAnything ? null : wantCategoryId,
        wantBrandId: data.wantAnything ? null : wantBrandId,
        ...(data.wantLocationScope !== undefined ? { wantLocationScope: data.wantLocationScope } : {}),
        ...(data.wantDamageStatuses !== undefined ? { wantDamageStatuses: data.wantDamageStatuses } : {}),
        note: data.note ?? null,
        description: data.description ?? null,
        damageStatus: data.damageStatus ?? null,
        engineCondition: data.engineCondition ?? null,
        engineNote: data.engineNote ?? null,
        transmissionCondition: data.transmissionCondition ?? null,
        transmissionNote: data.transmissionNote ?? null,
        runningGearCondition: data.runningGearCondition ?? null,
        runningGearNote: data.runningGearNote ?? null,
      },
    }),
    // Parça durumları formda gelen tam set neyse onunla değiştirilir (sil+yeniden
    // ekle) — böylece kullanıcı bir parçanın işaretini kaldırırsa (partConditions'ta
    // artık yoksa) eski kayıt da temizlenmiş olur.
    ...(data.partConditions !== undefined
      ? [
          prisma.tradeListingPartCondition.deleteMany({ where: { tradeListingId: listingId } }),
          ...(partConditionEntries.length > 0
            ? [
                prisma.tradeListingPartCondition.createMany({
                  data: partConditionEntries.map(([partKey, condition]) => ({
                    tradeListingId: listingId,
                    partKey,
                    condition,
                  })),
                }),
              ]
            : []),
        ]
      : []),
    // Tramer kayıtları da aynı ilkeyle (sil+yeniden ekle) güncellenir.
    ...(data.tramerRecords !== undefined
      ? [
          prisma.tradeTramerRecord.deleteMany({ where: { tradeListingId: listingId } }),
          ...(data.tramerRecords.length > 0
            ? [
                prisma.tradeTramerRecord.createMany({
                  data: data.tramerRecords.map((r) => ({
                    tradeListingId: listingId,
                    month: r.month,
                    year: r.year,
                    amount: r.amount,
                  })),
                }),
              ]
            : []),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
