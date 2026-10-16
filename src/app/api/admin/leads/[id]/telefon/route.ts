import { NextResponse } from "next/server";
import { adminIstek } from "@/lib/adminIstek";
import { prisma } from "@/lib/prisma";
import { pozitifTamsayiId } from "@/lib/validateId";
import { leadTelefonuCoz } from "@/lib/leadPhoneCrypto";
import { adminEylemiKaydet } from "@/lib/adminEylemKaydi";

// Admin listesinde telefon maskeli gelir; "Göster" tek bir kaydın tam numarasını getirir ve denetim kaydına yazar (kim, hangi kayıt).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const k = await adminIstek(req, { anahtar: "lead-telefon", adet: 60, pencereMs: 60 * 60 * 1000 });
  if ("hata" in k) return k.hata;

  const id = pozitifTamsayiId((await params).id);
  if (id === null) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const { kind } = (await req.json().catch(() => null)) ?? {};
  if (kind !== "insurance" && kind !== "sale") return NextResponse.json({ error: "Geçersiz tür." }, { status: 400 });

  const lead =
    kind === "insurance"
      ? await prisma.insuranceLead.findUnique({ where: { id }, select: { phone: true } })
      : await prisma.saleLead.findUnique({ where: { id }, select: { phone: true } });
  if (!lead) return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });

  // Önce kayıt, sonra numara: kayıt yazılamasa bile (best-effort) numara yalnız yetkili admine döner; numara kaydın kendisine konmaz.
  await adminEylemiKaydet({
    adminId: k.admin.userId,
    action: "LEAD_PHONE_REVEAL",
    entityType: "LEAD",
    entityId: id,
    entityLabel: kind === "insurance" ? "Sigorta talebi telefonu" : "Satış anı talebi telefonu",
    meta: { kind },
  });

  const res = NextResponse.json({ phone: leadTelefonuCoz(lead.phone) });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
