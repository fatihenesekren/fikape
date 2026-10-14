import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_IDS = 100;

// Okundu işaretleme. Gövde: { ids: number[] } (yalnız bunlar), { id: number } (eski tekil biçim) ya da boş (tümü).
// Geçersiz id/ids ASLA sessizce "tümü"ne düşmez (400). Yalnız çağıranın kendi bildirimleri etkilenir.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const userId = Number(session.user.id);

  const ham = await req.json().catch(() => null);
  const body: Record<string, unknown> = ham && typeof ham === "object" && !Array.isArray(ham) ? (ham as Record<string, unknown>) : {};

  const gecerliId = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0;

  let ids: number[] | undefined;
  if (body.ids !== undefined) {
    if (!Array.isArray(body.ids) || body.ids.length === 0 || body.ids.length > MAX_IDS || !body.ids.every(gecerliId)) {
      return NextResponse.json({ error: "Geçersiz bildirim listesi" }, { status: 400 });
    }
    ids = [...new Set(body.ids as number[])];
  } else if (body.id !== undefined) {
    if (!gecerliId(body.id)) return NextResponse.json({ error: "Geçersiz bildirim" }, { status: 400 });
    ids = [body.id];
  }

  const sonuc = await prisma.notification.updateMany({
    where: { userId, isRead: false, ...(ids ? { id: { in: ids } } : {}) },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true, updated: sonuc.count });
}
