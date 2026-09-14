import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkContent } from "@/lib/reviewValidation";
import { logContentFilterHit } from "@/lib/contentFilterLog";
import { expertNoteEditSchema, formatZodError } from "@/lib/schemas";
import { sanitizeStructured } from "@/lib/expertNote";

// Kullanıcı fark etti: yayınlanmış/bekleyen bir Usta Görüşü'nü SONRADAN
// düzenleme veya silme hiçbir yerde yoktu. Bu uç ikisini de ekliyor —
// yalnız notun kendi yazarı (profile.userId === oturum) işlem yapabilir.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const userId = parseInt(session.user.id);

  const { id } = await params;
  const noteId = parseInt(id);
  if (isNaN(noteId)) return NextResponse.json({ error: "Geçersiz not." }, { status: 400 });

  const parsed = expertNoteEditSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { title, body, structured } = parsed.data;

  const note = await prisma.expertNote.findUnique({
    where: { id: noteId },
    select: {
      status: true, title: true, body: true, structured: true, editCount: true,
      approvedQualityScore: true, profile: { select: { userId: true } },
    },
  });
  if (!note) return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
  if (note.profile.userId !== userId) {
    return NextResponse.json({ error: "Yalnızca kendi notunuzu düzenleyebilirsiniz." }, { status: 403 });
  }
  if (note.status === "HIDDEN") {
    return NextResponse.json({ error: "Silinmiş bir notu düzenleyemezsiniz." }, { status: 400 });
  }

  const clean = sanitizeStructured(structured);
  const combined = [title, body, ...Object.values(clean)].join("\n");
  const contentCheck = checkContent(combined);
  if (!contentCheck.ok) {
    logContentFilterHit({ userId, surface: "EXPERT_NOTE", rule: contentCheck.rule });
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  // Düzenleme, moderasyonu ATLAMAZ: yayındaki/reddedilen içerik değiştiğinde
  // yeniden incelemeye düşer (bkz. "moderasyonsuz kanal asla" ilkesi — bu
  // özelliğin tüm dokümantasyonunda tekrarlanan kural). Eski hâl versiyon
  // olarak saklanır (ExpertNoteVersion) — kaybolmuyor, denetlenebilir.
  // (HIDDEN durumu yukarıda zaten reddedildi, bu noktada PENDING/PUBLISHED/REJECTED'dan biri.)
  const nextStatus = "PENDING" as const;

  await prisma.$transaction([
    prisma.expertNoteVersion.create({
      data: {
        noteId,
        version: note.editCount + 1,
        title: note.title,
        body: note.body,
        structured: note.structured ?? {},
        approvedQualityScore: note.approvedQualityScore,
      },
    }),
    prisma.expertNote.update({
      where: { id: noteId },
      data: {
        title, body, structured: clean,
        status: nextStatus,
        editedAt: new Date(),
        editCount: { increment: 1 },
        rejectionReason: null,
        rejectedAt: null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, status: nextStatus });
}

// Yumuşak silme — HARD DELETE yok (ExpertNoteVote/ExpertNoteVersion/soru
// geçmişi RESTRICT FK ile korunuyor). status=HIDDEN, tüm okuma sorguları
// (araç sayfası) zaten yalnız PUBLISHED not çekiyor, HIDDEN hiç görünmez.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const userId = parseInt(session.user.id);

  const { id } = await params;
  const noteId = parseInt(id);
  if (isNaN(noteId)) return NextResponse.json({ error: "Geçersiz not." }, { status: 400 });

  const note = await prisma.expertNote.findUnique({
    where: { id: noteId },
    select: { status: true, profile: { select: { userId: true } } },
  });
  if (!note) return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
  if (note.profile.userId !== userId) {
    return NextResponse.json({ error: "Yalnızca kendi notunuzu silebilirsiniz." }, { status: 403 });
  }

  await prisma.expertNote.update({ where: { id: noteId }, data: { status: "HIDDEN" } });
  return NextResponse.json({ ok: true });
}
