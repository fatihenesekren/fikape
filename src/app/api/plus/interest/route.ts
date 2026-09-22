import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { PLUS_INTEREST_KEYS } from "@/lib/plusFeatures";

const bodySchema = z.object({
  interestKey: z.string().min(1).max(64),
  active: z.boolean(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const userId = parseInt(session.user.id);

  const allowed = await checkRateLimit(`plus-vote-${userId}`, 60, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar dene." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const { interestKey, active } = parsed.data;
  if (!PLUS_INTEREST_KEYS.has(interestKey)) {
    return NextResponse.json({ error: "Geçersiz seçenek." }, { status: 400 });
  }

  if (active) {
    await prisma.plusInterestVote.upsert({
      where: { userId_interestKey: { userId, interestKey } },
      create: { userId, interestKey },
      update: {},
    });
  } else {
    await prisma.plusInterestVote.deleteMany({ where: { userId, interestKey } });
  }

  return NextResponse.json({ ok: true });
}
