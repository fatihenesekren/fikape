import { NextResponse } from "next/server";
import { z } from "zod";
import { adminIstek } from "@/lib/adminIstek";
import { prisma } from "@/lib/prisma";
import { pozitifTamsayiId } from "@/lib/validateId";
import { jsonGovde } from "@/lib/katalog/rotaYardimci";

const sema = z.object({ islem: z.enum(["reddet", "geri-al"]) }).strict();

// Aday kararı: reddet (bir daha önerilmez) / geri al (yalnız reddedilmiş aday tekrar karar bekler).
// Ekleme bu uçtan değil, araç ekleme uç noktasından (adayId ile) yapılır.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const k = await adminIstek(req, { anahtar: "yazma", adet: 60, pencereMs: 60_000 });
  if ("hata" in k) return k.hata;
  const id = pozitifTamsayiId((await params).id);
  if (id === null) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const girdi = sema.safeParse(await jsonGovde(req));
  if (!girdi.success) return NextResponse.json({ error: "Geçersiz işlem." }, { status: 422 });

  const reddet = girdi.data.islem === "reddet";
  // Koşullu güncelleme: eşzamanlı kararlar birbirini ezmez
  const r = await prisma.newVehicleCandidate.updateMany({
    where: { id, durum: reddet ? "ONERILDI" : "REDDEDILDI" },
    data: reddet
      ? { durum: "REDDEDILDI", kararTarihi: new Date(), kararVerenId: k.admin.userId }
      : { durum: "ONERILDI", kararTarihi: null, kararVerenId: null },
  });
  if (r.count === 0) {
    return NextResponse.json({ error: reddet ? "Aday artık karar bekleyen durumda değil." : "Yalnız reddedilmiş aday geri alınabilir." }, { status: 409 });
  }
  return NextResponse.json({ id, durum: reddet ? "REDDEDILDI" : "ONERILDI" });
}
