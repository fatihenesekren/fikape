import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashRequestContext } from "@/lib/security";

const bodySchema = z.object({ isHelpful: z.boolean() });

// Usta notu faydalı/faydasız oyu — ReviewHelpfulVote deseniyle aynı.
// voteConfidence varsayılan 1 — gecelik oy-sahteciliği işi (api/cron/
// expert-vote-fraud) bunu günceller, barem bu alanı okur. ipHash/
// userAgentHash yalnız o iş için (KVKK: ham IP/UA tutulmaz).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const noteId = parseInt(id);
  if (isNaN(noteId)) return NextResponse.json({ error: "Geçersiz not." }, { status: 400 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const { isHelpful } = parsed.data;

  const userId = parseInt(session.user.id);

  const note = await prisma.expertNote.findUnique({
    where: { id: noteId },
    select: { status: true, profile: { select: { userId: true } } },
  });
  if (!note || note.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
  }
  if (note.profile.userId === userId) {
    return NextResponse.json({ error: "Kendi notuna oy veremezsin." }, { status: 403 });
  }

  const { ipHash, userAgentHash } = hashRequestContext(req);

  await prisma.expertNoteVote.upsert({
    where: { noteId_userId: { noteId, userId } },
    create: { noteId, userId, isHelpful, ipHash, userAgentHash },
    update: { isHelpful, ipHash, userAgentHash },
  });

  const [helpfulCount, notHelpfulCount] = await Promise.all([
    prisma.expertNoteVote.count({ where: { noteId, isHelpful: true } }),
    prisma.expertNoteVote.count({ where: { noteId, isHelpful: false } }),
  ]);

  return NextResponse.json({ ok: true, helpfulCount, notHelpfulCount });
}
