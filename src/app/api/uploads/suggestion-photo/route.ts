import { checkRateLimit } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const runtime = "nodejs";

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekiyor" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  // Dosya başına token isteği: kullanıcı başına saatlik üst sınır (depolama/fatura suistimaline karşı).
  if (body.type === "blob.generate-client-token" && !(await checkRateLimit(`upload:${session.user.id}`, 40, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Çok fazla yükleme yaptınız. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("suggestions/")) {
          throw new Error("Geçersiz dosya yolu");
        }
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_SIZE,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch {
    return NextResponse.json(
      { error: "Yükleme başarısız." },
      { status: 400 },
    );
  }
}
