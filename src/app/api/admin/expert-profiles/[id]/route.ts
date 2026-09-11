import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";

// Usta başvurusu karar ucu — approve / reject / promote (WAITLISTED → PENDING_VERIFICATION).
// Reddedilen başvuru SİLİNİR: bu profil hiçbir zaman ACTIVE olmadı (usta notu
// yazma ACTIVE gerektirir), dolayısıyla referans veren başka bir satır yok —
// "hiç var olmamış gibi" temizlemek, hiç toplanmamış bir başvurunun verisini
// gereksiz tutmamak anlamına gelir.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const adminId = Number(session.user.id);
  const adminUser = await prisma.user.findUnique({ where: { id: adminId }, select: { trustLevel: true } });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const profileId = parseInt(id);
  if (isNaN(profileId)) return NextResponse.json({ error: "Geçersiz başvuru." }, { status: 400 });

  const { action } = await req.json().catch(() => ({})) as { action?: "approve" | "reject" | "promote" };

  const profile = await prisma.expertProfile.findUnique({
    where: { id: profileId },
    select: { id: true, status: true, userId: true, slug: true },
  });
  if (!profile) return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 });
  if (profile.status !== "PENDING_VERIFICATION" && profile.status !== "WAITLISTED") {
    return NextResponse.json({ error: "Bu başvuru bu işlem için uygun durumda değil." }, { status: 409 });
  }

  if (action === "approve") {
    await prisma.expertProfile.update({
      where: { id: profileId },
      data: {
        status: "ACTIVE",
        verifiedAt: new Date(),
        verifiedBy: adminId,
        graceUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    });
    createNotification({
      userId: profile.userId,
      type: "EXPERT_VERIFIED",
      message: "Usta başvurunuz onaylandı — artık Usta Görüşü yazabilirsiniz",
      link: "/usta-gorusu/yaz",
    });
    return NextResponse.json({ ok: true, status: "ACTIVE", slug: profile.slug });
  }

  if (action === "promote") {
    if (profile.status !== "WAITLISTED") {
      return NextResponse.json({ error: "Yalnızca bekleme listesindeki başvurular öne alınabilir." }, { status: 409 });
    }
    await prisma.expertProfile.update({ where: { id: profileId }, data: { status: "PENDING_VERIFICATION" } });
    return NextResponse.json({ ok: true, status: "PENDING_VERIFICATION" });
  }

  if (action === "reject") {
    await prisma.expertProfile.delete({ where: { id: profileId } });
    createNotification({
      userId: profile.userId,
      type: "EXPERT_NOTE_REJECTED",
      message: "Usta başvurunuz bu aşamada onaylanmadı",
      link: "/usta-basvuru",
    });
    return NextResponse.json({ ok: true, status: "DELETED" });
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}
