import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userCityUpdateSchema, formatZodError } from "@/lib/schemas";

// Kullanıcının bölgesel eşleştirme için beyan ettiği il — opt-in, "Usta
// Görüşleri" tab'ındaki bağlamsal davetten kaydedilir (Aşama 9, §9).
// null göndermek = "Türkiye geneli" tercih edildi anlamına gelir.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const parsed = userCityUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });

  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { city: parsed.data.city },
  });

  return NextResponse.json({ ok: true });
}
