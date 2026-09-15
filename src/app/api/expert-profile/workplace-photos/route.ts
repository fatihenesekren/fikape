import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notification";
import { expertWorkplacePhotoUpdateSchema, formatZodError } from "@/lib/schemas";
import {
  MAX_STOREFRONT_PHOTOS, MAX_INTERIOR_PHOTOS,
  isExpertWorkplacePhotoUrl, computePhashes, hasDuplicate,
  deleteExpertWorkplacePhotoBlobs,
} from "@/lib/expertWorkplacePhotos";

// Usta çalışma yeri fotoğrafı ekleme/kaldırma — TradeListingPhoto akışıyla
// (api/trades/[id]/route.ts) aynı desen: URL whitelist, sayı sınırı, pHash
// tekrar kontrolü, PENDING olarak kaydedip admin'e bildirim. "Moderasyonsuz
// kanal asla" ilkesi — doğrudan yayına gitmez (3 ajanlı panel kararı).
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const userId = parseInt(session.user.id);

  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });
  if (!profile || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Yalnızca aktif ustalar bu ayarları değiştirebilir." }, { status: 403 });
  }

  const parsed = expertWorkplacePhotoUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  const { newPhotos, removeIds } = parsed.data;

  // ── Kaldırılacaklar — yalnızca BU profile ait satırlar ──────────────
  let removedUrls: string[] = [];
  if (removeIds.length > 0) {
    const rows = await prisma.expertWorkplacePhoto.findMany({
      where: { id: { in: removeIds }, profileId: profile.id },
      select: { id: true, url: true },
    });
    removedUrls = rows.map((r) => r.url);
  }
  const actuallyRemovedIds = removedUrls.length > 0
    ? (await prisma.expertWorkplacePhoto.findMany({ where: { url: { in: removedUrls }, profileId: profile.id }, select: { id: true } })).map((r) => r.id)
    : [];

  // ── Yeni yüklenenler — whitelist + tür bazlı sayım ──────────────────
  const validNew = newPhotos.filter((p) => isExpertWorkplacePhotoUrl(p.url));
  const newStorefront = validNew.filter((p) => p.kind === "STOREFRONT");
  const newInterior = validNew.filter((p) => p.kind === "INTERIOR");

  const [keptStorefront, keptInterior] = await Promise.all([
    prisma.expertWorkplacePhoto.count({
      where: { profileId: profile.id, kind: "STOREFRONT", status: { not: "REJECTED" }, id: { notIn: actuallyRemovedIds } },
    }),
    prisma.expertWorkplacePhoto.count({
      where: { profileId: profile.id, kind: "INTERIOR", status: { not: "REJECTED" }, id: { notIn: actuallyRemovedIds } },
    }),
  ]);
  if (keptStorefront + newStorefront.length > MAX_STOREFRONT_PHOTOS) {
    return NextResponse.json({ error: `Tabela/işletme girişi fotoğrafı en fazla ${MAX_STOREFRONT_PHOTOS} tane olabilir.` }, { status: 400 });
  }
  if (keptInterior + newInterior.length > MAX_INTERIOR_PHOTOS) {
    return NextResponse.json({ error: `İç mekan fotoğrafı en fazla ${MAX_INTERIOR_PHOTOS} tane olabilir.` }, { status: 400 });
  }

  let phashes: (string | null)[] = [];
  if (validNew.length > 0) {
    phashes = await computePhashes(validNew.map((p) => p.url));
    if (hasDuplicate(phashes)) {
      return NextResponse.json(
        { error: "Aynı fotoğrafı birden fazla kez eklemişsiniz gibi görünüyor, lütfen farklı fotoğraflar seçiniz." },
        { status: 400 },
      );
    }
  }

  await prisma.$transaction([
    ...(actuallyRemovedIds.length > 0
      ? [prisma.expertWorkplacePhoto.deleteMany({ where: { id: { in: actuallyRemovedIds } } })]
      : []),
    ...(validNew.length > 0
      ? [prisma.expertWorkplacePhoto.createMany({
          data: validNew.map((p, i) => ({
            profileId: profile.id,
            url: p.url,
            kind: p.kind,
            phash: phashes[i],
          })),
        })]
      : []),
  ]);

  // Blob temizliği — best-effort, transaction dışında (harici ağ çağrısı).
  deleteExpertWorkplacePhotoBlobs(removedUrls).catch(() => {});

  if (validNew.length > 0) {
    notifyAdmins({
      type: "ADMIN_NEW_EXPERT_WORKPLACE_PHOTO",
      message: "Onay bekleyen yeni bir çalışma yeri fotoğrafı var.",
      link: "/admin/usta-fotograflari",
      emailSubject: "Yeni çalışma yeri fotoğrafı",
      emailTitle: "Onay bekleyen usta fotoğrafı",
      emailMessage: "Bir usta profiline yeni çalışma yeri fotoğrafı yüklendi.",
      rateLimitKey: "expert-workplace-photo",
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
