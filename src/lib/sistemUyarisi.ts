import { prisma } from "@/lib/prisma";
import { sendAdminAlertEmail } from "@/lib/email";
import { resolveRecipients } from "@/lib/reports/alicilar";

// Sistem/güvenlik uyarıları — alıcılar haftalık raporla aynı (REPORT_RECIPIENTS).
// Aynı uyarı türü saatte en fazla 1 kez gider; sınır DB'de (ReportRun unique) tutulur,
// bellek-içi sayaç gibi sunucusuz örnekler arasında kaybolmaz. Çağıranı ASLA düşürmez.

export const GIRIS_HATASI_ESIK = 20;
export const GIRIS_HATASI_PENCERE_DK = 10;

/** Saatlik kova: "yyMMddTHH" (UTC) — ReportRun.isoWeek VarChar(10) sütununa sığar. */
export function uyariKovasi(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCFullYear() % 100)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}`;
}

/** ReportRun.kind VarChar(32): "alert:" + anahtar. */
export function uyariTuru(anahtar: string): string {
  return `alert:${anahtar}`.slice(0, 32);
}

export async function sistemUyarisiGonder(params: {
  anahtar: string;
  konu: string;
  baslik: string;
  mesaj: string;
  link?: string;
}): Promise<boolean> {
  const kind = uyariTuru(params.anahtar);
  const kova = uyariKovasi(new Date());
  try {
    await prisma.reportRun.create({ data: { kind, isoWeek: kova, status: "RUNNING" } });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") return false; // bu saat içinde zaten gönderildi
    console.error("[sistemUyarisi] kayıt yazılamadı:", e);
    return false;
  }

  try {
    const alicilar = await resolveRecipients();
    await Promise.all(
      alicilar.map((to) =>
        sendAdminAlertEmail({
          to,
          subject: params.konu,
          title: params.baslik,
          message: params.mesaj,
          link: params.link ?? "/admin",
        }),
      ),
    );
    await prisma.reportRun.update({
      where: { kind_isoWeek: { kind, isoWeek: kova } },
      data: { status: "SENT", finishedAt: new Date(), recipientCount: alicilar.length },
    });
    return alicilar.length > 0;
  } catch (e) {
    console.error("[sistemUyarisi] gönderilemedi:", e);
    await prisma.reportRun
      .update({
        where: { kind_isoWeek: { kind, isoWeek: kova } },
        data: { status: "FAILED", finishedAt: new Date(), error: String(e).slice(0, 500) },
      })
      .catch(() => {});
    return false;
  }
}

/** Başarısız giriş yığılması: son N dakikada eşik aşılırsa uyarır. */
export async function girisHatasiYiginiKontrol(): Promise<void> {
  try {
    const since = new Date(Date.now() - GIRIS_HATASI_PENCERE_DK * 60_000);
    const n = await prisma.accessLog.count({ where: { action: "LOGIN_FAILED", createdAt: { gte: since } } });
    if (n < GIRIS_HATASI_ESIK) return;
    await sistemUyarisiGonder({
      anahtar: "giris-hatasi",
      konu: "Başarısız giriş yığılması",
      baslik: "Olağandışı sayıda başarısız giriş",
      mesaj: `Son ${GIRIS_HATASI_PENCERE_DK} dakikada ${n} başarısız giriş denemesi kaydedildi. Parola deneme saldırısı olabilir.`,
    });
  } catch (e) {
    console.error("[sistemUyarisi] giriş kontrolü:", e);
  }
}

/** Cron hatasını e-postayla bildirir (aynı cron saatte 1 kez). */
export async function cronHatasiBildir(ad: string, hata: unknown): Promise<void> {
  console.error(`[cron/${ad}] başarısız oldu:`, hata);
  await sistemUyarisiGonder({
    anahtar: `cron:${ad}`,
    konu: `Cron hatası: ${ad}`,
    baslik: `Zamanlanmış görev başarısız — ${ad}`,
    mesaj: `"${ad}" cron'u hata verdi: ${String(hata).slice(0, 300)}`,
  });
}

/** Kendi try/catch'i olmayan cron'ları sarar: fırlatılan hatayı bildirir ve 500 döner. */
export function cronHataIzle(ad: string, handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (e) {
      await cronHatasiBildir(ad, e);
      return Response.json({ error: "Cron başarısız oldu." }, { status: 500 });
    }
  };
}
