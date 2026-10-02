import { NextResponse } from "next/server";
import { IsHatasi } from "@/lib/katalog/urunServis";

/** İş/Prisma hatalarını uygun HTTP yanıtına çevirir (500 yalnız beklenmeyen durumlarda). */
export function hataYaniti(e: unknown): NextResponse {
  if (e instanceof IsHatasi) return NextResponse.json(e.govde, { status: e.status });
  const kod = e && typeof e === "object" && "code" in e ? String((e as { code?: unknown }).code) : "";
  if (kod === "P2002") return NextResponse.json({ error: "Benzersiz kayıt çakışması (aynı adres/ad zaten var)" }, { status: 409 });
  if (kod === "P2003") return NextResponse.json({ error: "Kayıt başka kayıtlara bağlı olduğu için işlem yapılamadı" }, { status: 409 });
  if (kod === "P2025") return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  if (kod === "P2034") return NextResponse.json({ error: "Eşzamanlı işlem çakıştı, lütfen tekrar deneyin" }, { status: 409 });
  console.error("[admin/katalog]", e);
  return NextResponse.json({ error: "İşlem tamamlanamadı. Lütfen tekrar deneyin." }, { status: 500 });
}

export async function jsonGovde(req: Request): Promise<unknown | null> {
  return req.json().catch(() => null);
}
