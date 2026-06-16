import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailToken } from "@/lib/emailToken";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/?dogrulama=gecersiz", req.url));
  }

  const payload = verifyEmailToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/?dogrulama=gecersiz", req.url));
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    return NextResponse.redirect(new URL("/?dogrulama=gecersiz", req.url));
  }

  if (user.emailVerifiedAt) {
    return NextResponse.redirect(new URL("/?dogrulama=zaten", req.url));
  }

  await prisma.user.update({
    where: { id: payload.userId },
    data: {
      emailVerifiedAt: new Date(),
      trustLevel: Math.max(user.trustLevel, 2),
    },
  });

  return NextResponse.redirect(new URL("/?dogrulama=tamam", req.url));
}
