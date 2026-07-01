import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user.trustLevel as number) < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const photoId = parseInt(formData.get("photoId") as string);

  if (!file || isNaN(photoId)) {
    return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });
  }

  const filename = `reviews/blurred/${Date.now()}.jpg`;
  const blob = await put(filename, file, { access: "public" });

  await prisma.productPhoto.update({
    where: { id: photoId },
    data: { url: blob.url },
  });

  return NextResponse.json({ url: blob.url });
}
