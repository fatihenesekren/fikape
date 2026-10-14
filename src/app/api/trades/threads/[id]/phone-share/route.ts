import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pozitifTamsayiId } from "@/lib/validateId";
import { createNotification } from "@/lib/notification";
import { isPhoneShareEnabled, isTradeMessagingEnabled } from "@/lib/features";
import { kullaniciLimiti } from "@/lib/userRateLimit";
import { encryptPhone, normalizeTrMobile, phoneHash } from "@/lib/phoneShareCrypto";
import {
  DAILY_SHARE_LIMIT,
  MAX_USERS_PER_PHONE,
  getPhoneShareView,
  pairBlocked,
  recordPhoneShareConsent,
} from "@/lib/threadPhoneShare";

// Takas görüşmesinde karşılıklı telefon paylaşımı. Yetki kalıbı mesaj uçlarıyla aynı: taraf değilse 404.
// Yanıtlar `no-store`; karşı tarafın numarası HİÇBİR yanıtta dönmez (yalnız sayfa SSR'ında, iki taraf da paylaştıysa çözülür).
const NO_STORE = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

async function yukle(req: Request, params: Promise<{ id: string }>) {
  if (!isTradeMessagingEnabled() || !isPhoneShareEnabled()) {
    return { hata: json({ error: "Bu özellik geçici olarak kapalı." }, 503) };
  }
  const session = await auth();
  if (!session?.user?.id) return { hata: json({ error: "Giriş gerekli." }, 401) };
  const userId = Number(session.user.id);

  const limit = await kullaniciLimiti(session, "thread-phone-share", 20, 60 * 60 * 1000);
  if (limit) return { hata: limit };

  const { id } = await params;
  const threadId = pozitifTamsayiId(id) ?? NaN;
  if (isNaN(threadId)) return { hata: json({ error: "Görüşme bulunamadı." }, 404) };

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      initiatorId: true,
      closedByUserId: true,
      blockedByUserId: true,
      tradeListing: {
        select: {
          userId: true,
          isActive: true,
          product: { select: { brand: { select: { name: true } }, model: { select: { name: true } } } },
        },
      },
    },
  });
  if (!thread || (thread.initiatorId !== userId && thread.tradeListing.userId !== userId)) {
    return { hata: json({ error: "Görüşme bulunamadı." }, 404) };
  }
  const counterpartId = userId === thread.initiatorId ? thread.tradeListing.userId : thread.initiatorId;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isBanned: true, emailVerifiedAt: true, displayName: true } });
  if (!user || user.isBanned) return { hata: json({ error: "Bu işlemi yapamazsınız." }, 403) };

  return { userId, threadId, thread, counterpartId, user, req };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await yukle(req, params);
  if ("hata" in ctx) return ctx.hata;
  const { userId, threadId, thread, counterpartId, user } = ctx;

  if (!user.emailVerifiedAt) {
    return json({ error: "Telefon paylaşabilmek için önce e-posta adresinizi doğrulayınız." }, 403);
  }
  if (thread.blockedByUserId != null || thread.closedByUserId != null) {
    return json({ error: "Bu görüşme kapalı, numara paylaşamazsınız." }, 403);
  }
  if (!thread.tradeListing.isActive) {
    return json({ error: "Bu ilan artık takasa açık değil." }, 403);
  }
  if (await pairBlocked(userId, counterpartId)) {
    return json({ error: "Bu kullanıcıyla iletişim kuramazsınız." }, 403);
  }

  const body = (await req.json().catch(() => null)) as { phone?: unknown; consent?: unknown } | null;
  if (body?.consent !== true) {
    return json({ error: "Devam etmek için paylaşımı onaylamanız gerekir." }, 400);
  }
  const phone = typeof body.phone === "string" ? normalizeTrMobile(body.phone) : null;
  if (!phone) {
    return json({ error: "Lütfen geçerli bir cep telefonu numarası giriniz (örn. 0532 123 45 67)." }, 400);
  }

  // Kötüye kullanım sınırları: günlük paylaşım üst sınırı (ConsentLog'dan — satırlar silinse de sayım kalır) ve
  // aynı numaranın çok sayıda farklı hesapta kullanımı (numara toplama/başkasının numarasını girme işareti).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [sonGunPaylasim, ayniNumara] = await Promise.all([
    prisma.consentLog.count({
      where: { userId, consentType: "TRADE_PHONE_SHARE", isGranted: true, createdAt: { gte: since } },
    }),
    prisma.threadPhoneShare.findMany({
      where: { phoneHash: phoneHash(phone.e164), userId: { not: userId } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);
  if (sonGunPaylasim >= DAILY_SHARE_LIMIT) {
    return json({ error: "Bugün için numara paylaşım sınırına ulaştınız. Lütfen yarın tekrar deneyiniz." }, 429);
  }
  if (ayniNumara.length >= MAX_USERS_PER_PHONE) {
    return json({ error: "Bu numara şu an paylaşılamıyor. Destek ekibimizle iletişime geçebilirsiniz." }, 409);
  }

  const mevcut = await prisma.threadPhoneShare.findUnique({
    where: { threadId_userId: { threadId, userId } },
    select: { id: true },
  });
  if (mevcut) return json({ error: "Bu görüşmede numaranızı zaten paylaştınız." }, 409);

  try {
    await prisma.threadPhoneShare.create({
      data: {
        threadId,
        userId,
        phoneEnc: encryptPhone(phone.e164, `${threadId}:${userId}`),
        phoneLast2: phone.last2,
        phoneHash: phoneHash(phone.e164),
      },
    });
  } catch {
    // eşzamanlı çift istek: unique kısıt ikincisini düşürür
    return json({ error: "Bu görüşmede numaranızı zaten paylaştınız." }, 409);
  }
  await recordPhoneShareConsent(userId, threadId, true, req).catch((e) => console.error("[phone-share] rıza kaydı", e));

  // Bildirim numara İÇERMEZ.
  const karsiPaylasti = (await prisma.threadPhoneShare.count({ where: { threadId, userId: counterpartId } })) > 0;
  const me = user.displayName?.trim() || "Bir kullanıcı";
  const vehicle = `${thread.tradeListing.product.brand.name} ${thread.tradeListing.product.model.name}`;
  createNotification({
    userId: counterpartId,
    type: "TRADE_PHONE_SHARED",
    message: karsiPaylasti
      ? `${me} ile "${vehicle}" görüşmenizde numaralar karşılıklı görünür oldu.`
      : `${me}, "${vehicle}" görüşmesinde telefon numarasını paylaştı. Görmek için siz de paylaşabilirsiniz.`,
    link: `/mesajlar/${threadId}`,
  });

  const view = await getPhoneShareView(threadId, userId, true);
  return json({ ok: true, mine: view.mine, counterpartShared: view.counterpartShared });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await yukle(req, params);
  if ("hata" in ctx) return ctx.hata;
  const { userId, threadId, counterpartId } = ctx;

  // Karşı taraf da paylaştıysa numaralar zaten görüldü: geri çekme anlamsız ve yanıltıcı olur (sunucuda zorunlu).
  const karsi = await prisma.threadPhoneShare.count({ where: { threadId, userId: counterpartId } });
  if (karsi > 0) {
    return json({ error: "Karşı taraf da numarasını paylaştığı için geri çekilemez. Numaraları gizlemek için görüşmeyi kapatabilirsiniz." }, 409);
  }

  const silinen = await prisma.threadPhoneShare.deleteMany({ where: { threadId, userId } });
  if (silinen.count > 0) {
    await recordPhoneShareConsent(userId, threadId, false, req).catch((e) => console.error("[phone-share] rıza kaydı", e));
  }
  return json({ ok: true });
}
