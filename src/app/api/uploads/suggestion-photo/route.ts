import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekiyor" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Sadece JPEG, PNG veya WebP yüklenebilir" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Dosya en fazla 5 MB olabilir" }, { status: 400 });
  }

  const ext = file.type.split("/")[1];
  const filename = `suggestions/${session.user.id}/${Date.now()}.${ext}`;

  const blob = await put(filename, file, { access: "public" });

  return NextResponse.json({ url: blob.url }, { status: 201 });
}
