import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * Oturum açmış kullanıcı başına hız sınırı. Oturum yoksa null döner (çağıranın kendi 401'i çalışır);
 * limit aşılmışsa dönülecek 429 yanıtını verir.
 */
export async function kullaniciLimiti(
  session: Session | null,
  anahtar: string,
  limit: number,
  pencereMs: number,
): Promise<NextResponse | null> {
  const id = session?.user?.id;
  if (!id) return null;
  if (await checkRateLimit(`${anahtar}:${id}`, limit, pencereMs)) return null;
  return NextResponse.json({ error: "Çok fazla istek gönderdiniz. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
}
