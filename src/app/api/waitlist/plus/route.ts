import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { plusWaitlistSchema, formatZodError } from "@/lib/schemas";
import { rateLimitByIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!rateLimitByIp(req, "plus-waitlist", 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar dene." }, { status: 429 });
  }

  const parsed = plusWaitlistSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { email, note } = parsed.data;

  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const existing = await prisma.plusWaitlistEntry.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyJoined: true });
  }

  await prisma.plusWaitlistEntry.create({
    data: { email, note: note ?? null, userId },
  });

  return NextResponse.json({ ok: true, alreadyJoined: false }, { status: 201 });
}
