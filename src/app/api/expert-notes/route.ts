import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkContent } from "@/lib/reviewValidation";
import { logContentFilterHit } from "@/lib/contentFilterLog";
import { expertNoteCreateSchema, formatZodError } from "@/lib/schemas";
import { notifyAdmins } from "@/lib/notification";
import {
  sanitizeStructured,
  EXPERT_NOTE_RATE_DAY,
  EXPERT_NOTE_RATE_WEEK,
} from "@/lib/expertNote";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

// Usta Görüşü oluşturma — MODEL seviyesi, skorsuz. Yalnız ExpertStatus=ACTIVE
// ustalar. Her not PENDING başlar, admin moderasyonundan geçer.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const userId = parseInt(session.user.id);

  const parsed = expertNoteCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const modelId = Number(parsed.data.modelId);
  const { title, body, structured } = parsed.data;
  if (!Number.isInteger(modelId) || modelId <= 0) {
    return NextResponse.json({ error: "Geçersiz model." }, { status: 400 });
  }

  // Usta yetkisi
  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });
  if (!profile || profile.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Usta Görüşü yazmak için onaylanmış bir usta profiliniz olmalı." },
      { status: 403 }
    );
  }

  // İçerik filtresi — gövde + başlık + yapılandırılmış alanlar (iletişim bilgisi,
  // link, handle vb. yalnız yapılandırılmış CV alanında olabilir, notta ASLA).
  const clean = sanitizeStructured(structured);
  const combined = [title, body, ...Object.values(clean)].join("\n");
  const contentCheck = checkContent(combined);
  if (!contentCheck.ok) {
    logContentFilterHit({ userId, surface: "EXPERT_NOTE", rule: contentCheck.rule });
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  // Model doğrulama — aktif ürünü olan bir model olmalı
  const model = await prisma.model.findFirst({
    where: { id: modelId, isActive: true, products: { some: { isActive: true } } },
    select: { id: true },
  });
  if (!model) return NextResponse.json({ error: "Geçersiz model." }, { status: 400 });

  // Rate limit — sahiplik yorumundan ayrı, gevşek ama sınırlı (moderasyon kuyruğunu korur)
  const [dayCount, weekCount] = await Promise.all([
    prisma.expertNote.count({
      where: { profileId: profile.id, createdAt: { gte: new Date(Date.now() - DAY_MS) } },
    }),
    prisma.expertNote.count({
      where: { profileId: profile.id, createdAt: { gte: new Date(Date.now() - WEEK_MS) } },
    }),
  ]);
  if (dayCount >= EXPERT_NOTE_RATE_DAY || weekCount >= EXPERT_NOTE_RATE_WEEK) {
    return NextResponse.json(
      { error: "Kısa sürede çok fazla usta notu gönderdiniz. Lütfen daha sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const note = await prisma.expertNote.create({
    data: {
      profileId: profile.id,
      modelId,
      title,
      body,
      structured: clean,
      status: "PENDING",
    },
    select: { id: true },
  });

  notifyAdmins({
    type: "ADMIN_NEW_EXPERT_NOTE",
    message: "Onay bekleyen yeni bir usta notu var",
    link: "/admin/usta-notlari",
    emailSubject: "Yeni usta notu — onay bekliyor",
    emailTitle: "Yeni usta notu",
    emailMessage: `"${title}" başlıklı usta notu moderasyon bekliyor.`,
    rateLimitKey: "expert-note",
  }).catch(() => {});

  return NextResponse.json({ ok: true, noteId: note.id }, { status: 201 });
}
