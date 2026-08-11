import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { savedSearchCreateSchema, formatZodError } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const userId = Number(session.user.id);

  const parsed = savedSearchCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { city } = parsed.data;
  const categoryId = parsed.data.categoryId != null ? Number(parsed.data.categoryId) : null;
  const brandId = parsed.data.brandId != null ? Number(parsed.data.brandId) : null;

  if (!(await checkRateLimit(`saved-search-create:${userId}`, 20, 24 * 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Günlük kayıtlı arama sınırına ulaştınız." }, { status: 429 });
  }

  try {
    const saved = await prisma.savedSearch.create({
      data: { userId, city, categoryId, brandId },
    });
    return NextResponse.json({ ok: true, id: saved.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bu arama zaten kayıtlı." }, { status: 409 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const userId = Number(session.user.id);
  const searches = await prisma.savedSearch.findMany({
    where: { userId },
    include: { category: { select: { name: true } }, brand: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ searches });
}
