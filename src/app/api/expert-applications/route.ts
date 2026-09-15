import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkContent } from "@/lib/reviewValidation";
import { logContentFilterHit } from "@/lib/contentFilterLog";
import { expertApplicationSchema, formatZodError } from "@/lib/schemas";
import { slugify } from "@/lib/slugify";
import { notifyAdmins } from "@/lib/notification";
import { isApplicationWindowOpen } from "@/lib/expertApplication";
import { recordConsent } from "@/lib/consent";
import {
  MAX_STOREFRONT_PHOTOS, MAX_INTERIOR_PHOTOS,
  isExpertWorkplacePhotoUrl, computePhashes, hasDuplicate,
} from "@/lib/expertWorkplacePhotos";

// Usta başvurusu — herkese açık, admin onayı zorunlu (pilot yok — §5). Başvuru
// penceresi dışında WAITLISTED olarak kaydedilir (§5.2); kademeli aylık kota
// (K) ve backpressure onay AŞAMASINDA admin panelinde uygulanır, burada değil.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const userId = parseInt(session.user.id);

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerifiedAt: true },
  });
  if (!dbUser?.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Başvurmak için e-posta adresinizi doğrulamanız gerekiyor." },
      { status: 403 }
    );
  }

  const existing = await prisma.expertProfile.findUnique({
    where: { userId },
    select: { status: true },
  });
  if (existing && existing.status !== "CLOSED") {
    return NextResponse.json(
      { error: "Zaten bir usta başvurunuz veya profiliniz var." },
      { status: 409 }
    );
  }

  const parsed = expertApplicationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { headline, expertiseTags, city, district, bio, consentWorkplacePhoto, workplacePhotos } = parsed.data;

  const combined = [headline, bio, ...expertiseTags].join("\n");
  const contentCheck = checkContent(combined);
  if (!contentCheck.ok) {
    logContentFilterHit({ userId, surface: "EXPERT_NOTE", rule: contentCheck.rule });
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  const cleanTags = expertiseTags.map((t) => t.trim().slice(0, 40)).filter(Boolean).slice(0, 8);

  // Çalışma yeri fotoğrafları — opsiyonel, api/expert-profile/workplace-photos
  // ile AYNI kurallar (whitelist, sayı sınırı, batch-içi pHash tekrarı).
  // Rıza yoksa fotoğraflar sessizce yok sayılır (form zaten rıza kapalıyken
  // yükleme alanlarını göstermeyecek, ama sunucu yine de doğrular).
  const validNewPhotos = consentWorkplacePhoto ? workplacePhotos.filter((p) => isExpertWorkplacePhotoUrl(p.url)) : [];
  const storefrontCount = validNewPhotos.filter((p) => p.kind === "STOREFRONT").length;
  const interiorCount = validNewPhotos.filter((p) => p.kind === "INTERIOR").length;
  if (storefrontCount > MAX_STOREFRONT_PHOTOS) {
    return NextResponse.json({ error: `Tabela/işletme girişi fotoğrafı en fazla ${MAX_STOREFRONT_PHOTOS} tane olabilir.` }, { status: 400 });
  }
  if (interiorCount > MAX_INTERIOR_PHOTOS) {
    return NextResponse.json({ error: `İç mekan fotoğrafı en fazla ${MAX_INTERIOR_PHOTOS} tane olabilir.` }, { status: 400 });
  }
  let photoPhashes: (string | null)[] = [];
  if (validNewPhotos.length > 0) {
    photoPhashes = await computePhashes(validNewPhotos.map((p) => p.url));
    if (hasDuplicate(photoPhashes)) {
      return NextResponse.json(
        { error: "Aynı fotoğrafı birden fazla kez eklemişsiniz gibi görünüyor, lütfen farklı fotoğraflar seçiniz." },
        { status: 400 },
      );
    }
  }

  // slug: oluşturmada DONDURULUR (§6) — displayName veya e-posta yereli
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true, email: true } });
  const base = slugify(user?.displayName || user?.email.split("@")[0] || "usta") || "usta";
  let slug = base;
  let n = 1;
  while (await prisma.expertProfile.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${++n}`;
  }

  const status = isApplicationWindowOpen() ? "PENDING_VERIFICATION" : "WAITLISTED";

  let profileId: number;
  if (existing) {
    // CLOSED'dan yeniden başvuru — aynı satırı güncelle
    const updated = await prisma.expertProfile.update({
      where: { userId },
      data: { slug, headline, expertiseTags: cleanTags, city, district: district || null, bio, status },
      select: { id: true },
    });
    profileId = updated.id;
  } else {
    const created = await prisma.expertProfile.create({
      data: { userId, slug, headline, expertiseTags: cleanTags, city, district: district || null, bio, status },
      select: { id: true },
    });
    profileId = created.id;
  }

  if (validNewPhotos.length > 0) {
    await prisma.expertWorkplacePhoto.createMany({
      data: validNewPhotos.map((p, i) => ({
        profileId,
        url: p.url,
        kind: p.kind,
        phash: photoPhashes[i],
      })),
    });
    await recordConsent({ userId, consentType: "EXPERT_WORKPLACE_PHOTO", isGranted: true, req });
    notifyAdmins({
      type: "ADMIN_NEW_EXPERT_WORKPLACE_PHOTO",
      message: "Onay bekleyen yeni bir çalışma yeri fotoğrafı var.",
      link: "/admin/usta-fotograflari",
      emailSubject: "Yeni çalışma yeri fotoğrafı",
      emailTitle: "Onay bekleyen usta fotoğrafı",
      emailMessage: "Yeni bir usta başvurusuyla birlikte çalışma yeri fotoğrafı yüklendi.",
      rateLimitKey: "expert-workplace-photo",
    }).catch(() => {});
  }

  if (status === "PENDING_VERIFICATION") {
    notifyAdmins({
      type: "ADMIN_NEW_EXPERT_APPLICATION",
      message: "Onay bekleyen yeni bir usta başvurusu var",
      link: "/admin/usta-basvurulari",
      emailSubject: "Yeni usta başvurusu — onay bekliyor",
      emailTitle: "Yeni usta başvurusu",
      emailMessage: `"${headline}" başlıklı usta başvurusu moderasyon bekliyor.`,
      rateLimitKey: "expert-application",
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, status }, { status: 201 });
}
