import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { savedSearchCreateSchema, formatZodError } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rateLimit";
import { buildSavedSearchCriteriaKey } from "@/lib/savedSearchCriteria";
import { Prisma } from "@/generated/prisma/client";

// Kullanıcı başına toplam kayıtlı arama sınırı. Günlük hız limiti (20) tek başına birikimi engellemiyordu.
const MAX_KAYITLI_ARAMA = 20;

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const userId = Number(session.user.id);

  const parsed = savedSearchCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { city, paymentIntent, yearMin, yearMax, kmMin, kmMax } = parsed.data;
  const categoryId = parsed.data.categoryId != null ? Number(parsed.data.categoryId) : null;
  const brandId = parsed.data.brandId != null ? Number(parsed.data.brandId) : null;
  const fuelTypes = parsed.data.fuelTypes ?? [];
  const transmissions = parsed.data.transmissions ?? [];

  // Toplam sınır hız limitinden ÖNCE: sınırdaki kullanıcı boşuna günlük hakkını da yemesin. Sınırı zaten aşmış
  // kullanıcıların mevcut aramaları silinmez, yalnız yeni kayıt reddedilir.
  const mevcut = await prisma.savedSearch.count({ where: { userId } });
  if (mevcut >= MAX_KAYITLI_ARAMA) {
    return NextResponse.json(
      { error: `En fazla ${MAX_KAYITLI_ARAMA} kayıtlı aramanız olabilir; birini silip tekrar deneyiniz.` },
      { status: 409 },
    );
  }

  if (!(await checkRateLimit(`saved-search-create:${userId}`, 20, 24 * 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Günlük kayıtlı arama sınırına ulaştınız." }, { status: 429 });
  }

  const criteriaKey = buildSavedSearchCriteriaKey({
    city, categoryId, brandId,
    paymentIntent: paymentIntent ?? null,
    yearMin: yearMin ?? null, yearMax: yearMax ?? null,
    kmMin: kmMin ?? null, kmMax: kmMax ?? null,
    fuelTypes, transmissions,
  });

  try {
    // Yarış koruması: sayım ile create atomik değildi; paralel istekler 20 sınırını aşabilirdi. Kullanıcı başına advisory kilit
    // (anahtar 1) altında sınır yeniden denetlenir.
    const saved = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userId}::int, 1)`;
      if ((await tx.savedSearch.count({ where: { userId } })) >= MAX_KAYITLI_ARAMA) return null;
      return tx.savedSearch.create({
        data: {
          userId, city, categoryId, brandId,
          paymentIntent: paymentIntent ?? null,
          yearMin: yearMin ?? null, yearMax: yearMax ?? null,
          kmMin: kmMin ?? null, kmMax: kmMax ?? null,
          fuelTypes, transmissions,
          criteriaKey,
        },
      });
    });
    if (!saved) {
      return NextResponse.json(
        { error: `En fazla ${MAX_KAYITLI_ARAMA} kayıtlı aramanız olabilir; birini silip tekrar deneyiniz.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, id: saved.id }, { status: 201 });
  } catch (e) {
    // Önceden HER hata "zaten kayıtlı" diyordu (veritabanı kesintisi dahil). Yalnız benzersizlik çakışması 409.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Bu arama zaten kayıtlı." }, { status: 409 });
    }
    console.error("[saved-searches]", e);
    return NextResponse.json({ error: "Arama kaydedilemedi, lütfen tekrar deneyiniz." }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const userId = Number(session.user.id);
  const searches = await prisma.savedSearch.findMany({
    where: { userId },
    include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ searches });
}
