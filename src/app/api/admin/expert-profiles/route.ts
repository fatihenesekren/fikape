import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { createNotification } from "@/lib/notification";

// GEÇİCİ BOOTSTRAP UCU — herkese açık usta başvuru formu (Aşama 5: başvuru
// penceresi + kademeli kota + WAITLISTED + belge doğrulama) henüz yok. Bu uç,
// Aşama 3'ün (not moderasyonu) test edilebilmesi için admin'in bir kullanıcıyı
// e-postasıyla bularak doğrudan ACTIVE usta yapmasını sağlar. Aşama 5 canlıya
// çıkınca bu uç ya kaldırılır ya da başvuru onay akışının bir parçası olur.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const adminId = Number(session.user.id);
  const adminUser = await prisma.user.findUnique({
    where: { id: adminId },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { email } = await req.json().catch(() => ({})) as { email?: string };
  const trimmedEmail = email?.trim().toLowerCase();
  if (!trimmedEmail) return NextResponse.json({ error: "E-posta zorunludur." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: trimmedEmail },
    select: { id: true, displayName: true, email: true },
  });
  if (!user) return NextResponse.json({ error: "Bu e-postayla kayıtlı kullanıcı yok." }, { status: 404 });

  const existing = await prisma.expertProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, status: true, slug: true },
  });

  if (existing) {
    if (existing.status === "ACTIVE") {
      return NextResponse.json({ error: "Bu kullanıcı zaten aktif usta." }, { status: 409 });
    }
    await prisma.expertProfile.update({
      where: { id: existing.id },
      data: {
        status: "ACTIVE",
        verifiedAt: new Date(),
        verifiedBy: adminId,
        graceUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 2 ay grace
      },
    });
    createNotification({
      userId: user.id,
      type: "EXPERT_VERIFIED",
      message: "Usta başvurunuz onaylandı — artık Usta Görüşü yazabilirsiniz",
      link: "/usta-gorusu/yaz",
    });
    return NextResponse.json({ ok: true, slug: existing.slug });
  }

  // slug: displayName veya e-posta yerelinden — oluşturmada DONDURULUR (§6)
  const base = slugify(user.displayName || trimmedEmail.split("@")[0]) || "usta";
  let slug = base;
  let n = 1;
  while (await prisma.expertProfile.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${++n}`;
  }

  await prisma.expertProfile.create({
    data: {
      userId: user.id,
      slug,
      status: "ACTIVE",
      verifiedAt: new Date(),
      verifiedBy: adminId,
      graceUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  createNotification({
    userId: user.id,
    type: "EXPERT_VERIFIED",
    message: "Usta başvurunuz onaylandı — artık Usta Görüşü yazabilirsiniz",
    link: "/usta-gorusu/yaz",
  });

  return NextResponse.json({ ok: true, slug });
}
