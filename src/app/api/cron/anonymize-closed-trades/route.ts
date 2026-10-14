import { cronYetkili } from "@/lib/cronAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cronHatasiBildir } from "@/lib/sistemUyarisi";
import { deleteTradePhotoBlobs } from "@/lib/tradeListingPhotos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RETENTION_MS = 183 * 24 * 60 * 60 * 1000; // ~6 ay
const PHONE_SHARE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!cronYetkili(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // KVKK saklama süresi taahhüdüne bağlı bir iş — sessizce başarısız olursa fark
  // edilmeden 6 aylık taahhüt ihlal edilebilir (bkz. denetim raporu), bu yüzden
  // hata burada mutlaka loglanıyor.
  try {
    const cutoff = new Date(Date.now() - RETENTION_MS);

    // Telefon paylaşımları: ilan kapandıktan 30 gün sonra silinir (mesajlardaki 6 aydan çok daha kısa — iletişim
    // bilgisi amaç bitince tutulmaz). Görüşme kapanırken/engellenirken zaten anında silinir.
    const phoneCutoff = new Date(Date.now() - PHONE_SHARE_RETENTION_MS);
    const phoneResult = await prisma.threadPhoneShare.deleteMany({
      where: {
        OR: [
          { thread: { tradeListing: { isActive: false, closedAt: { lt: phoneCutoff } } } },
          // savunma katmanı: kapatma/engelleme anında silinmesi gereken numaralar herhangi bir nedenle kalmışsa
          { thread: { OR: [{ closedByUserId: { not: null } }, { blockedByUserId: { not: null } }] } },
        ],
      },
    });

    // anonymizedAt:null ile idempotent hale getirildi — önceden mesaj metnindeki
    // placeholder'a bakarak (implicit) tekrarı önlüyordu, bu artık açık bir alan.
    const staleListings = await prisma.tradeListing.findMany({
      where: { isActive: false, closedAt: { lt: cutoff }, anonymizedAt: null },
      select: { id: true },
    });

    if (staleListings.length === 0) {
      return NextResponse.json({ ok: true, anonymized: 0, phoneShares: phoneResult.count });
    }

    const listingIds = staleListings.map((l) => l.id);

    // Takas fotoğrafları — KVKK saklama süresi dolan ilanların fotoğrafları da
    // blob'dan ve DB'den silinir (blob del harici ağ, transaction dışında).
    const stalePhotos = await prisma.tradeListingPhoto.findMany({
      where: { tradeListingId: { in: listingIds } },
      select: { id: true, url: true },
    });
    if (stalePhotos.length > 0) {
      await deleteTradePhotoBlobs(stalePhotos.map((p) => p.url)).catch(() => {});
      await prisma.tradeListingPhoto.deleteMany({ where: { id: { in: stalePhotos.map((p) => p.id) } } });
    }

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

    return NextResponse.json({ ok: true, listings: staleListings.length, anonymized: messageResult.count, phoneShares: phoneResult.count });
  } catch (e) {
    await cronHatasiBildir("anonymize-closed-trades", e);
    return NextResponse.json({ error: "Anonimleştirme işlemi başarısız oldu." }, { status: 500 });
  }
}
