import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";
import { stripGenRangeAnywhere } from "@/lib/modelDisplay";

// Usta notu moderasyonu — onayda admin kalite puanı (0/1/2) girilir; bu puan
// barem'in okuduğu approvedQualityScore'a yazılır (canlı qualityScore'dan
// AYRI — sonradan yapılan düzenleme bareme stale/gaming girmesin diye, bkz.
// docs/usta-gorusleri-plan.md §8 A8 + S12).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const noteId = parseInt(id);
  if (isNaN(noteId)) return NextResponse.json({ error: "Geçersiz not." }, { status: 400 });

  const body = await req.json().catch(() => null) as
    | { action: "approve"; qualityScore: 0 | 1 | 2 }
    | { action: "reject"; reason?: string }
    | null;
  if (!body) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  const note = await prisma.expertNote.findUnique({
    where: { id: noteId },
    select: {
      status: true, title: true,
      profile: { select: { userId: true } },
      model: {
        select: {
          name: true,
          products: {
            where: { isActive: true },
            orderBy: { weeklyViewCount: "desc" },
            take: 1,
            select: { slug: true },
          },
        },
      },
    },
  });
  if (!note) return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
  // PENDING dışı statüden de bir düzenleme sonrası yeniden moderasyona düşebilir
  // (bkz. §8 A6) — burada da PENDING dışı işlenmez.
  if (note.status !== "PENDING") {
    return NextResponse.json({ error: "Bu not bu işlem için uygun durumda değil." }, { status: 409 });
  }

  const modelName = stripGenRangeAnywhere(note.model.name);
  const productSlug = note.model.products[0]?.slug;

  if (body.action === "approve") {
    if (![0, 1, 2].includes(body.qualityScore)) {
      return NextResponse.json({ error: "Kalite puanı 0, 1 veya 2 olmalıdır." }, { status: 400 });
    }
    // İki admin aynı notu aynı anda açıp biri onaylar biri reddederse,
    // ikinci istek `where: status=PENDING` şartını sağlamadığı için
    // sessizce hiçbir şey değiştirmez — kod aşağıda count===0 kontrolüyle
    // bunu yakalayıp 409 döner (önceden yalnız `id` ile güncelliyordu,
    // ikinci isteğin birinciyi ezmesi mümkündü).
    const { count } = await prisma.expertNote.updateMany({
      where: { id: noteId, status: "PENDING" },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        qualityScore: body.qualityScore,
        approvedQualityScore: body.qualityScore,
      },
    });
    if (count === 0) {
      return NextResponse.json({ error: "Bu not az önce başka bir admin tarafından işlendi." }, { status: 409 });
    }
    createNotification({
      userId: note.profile.userId,
      type: "EXPERT_NOTE_PUBLISHED",
      message: `"${note.title}" başlıklı usta notunuz yayınlandı`,
      link: productSlug ? `/araclar/${productSlug}?sekme=usta-gorusleri` : "/usta-gorusu/notlarim",
      expertNoteId: noteId,
    });
    return NextResponse.json({ ok: true, status: "PUBLISHED" });
  }

  if (body.action === "reject") {
    const { count } = await prisma.expertNote.updateMany({
      where: { id: noteId, status: "PENDING" },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectionReason: body.reason?.slice(0, 300) || null,
      },
    });
    if (count === 0) {
      return NextResponse.json({ error: "Bu not az önce başka bir admin tarafından işlendi." }, { status: 409 });
    }
    createNotification({
      userId: note.profile.userId,
      type: "EXPERT_NOTE_REJECTED",
      message: `${modelName} hakkındaki usta notunuz yayınlanmadı`,
      link: "/usta-gorusu/notlarim",
    });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}
