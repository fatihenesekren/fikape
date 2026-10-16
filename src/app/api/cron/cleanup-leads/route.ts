import { cronYetkili } from "@/lib/cronAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cronHatasiBildir } from "@/lib/sistemUyarisi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// KVKK saklama süresi sınırlaması ilkesi — sigorta/satış lead'leri (telefon
// içeriyor) süresiz tutulmasın diye. Şu an aktif bir partner olmadığından
// (bkz. InsuranceLeadCard/SaleLeadCard metinleri) 2 yıl, 5651 trafik logu
// için kullanılan üst sınırla tutarlı, konservatif bir varsayılan.
const RETENTION_MS = 2 * 365 * 24 * 60 * 60 * 1000; // 2 yıl
// Rıza/onay kayıtları (ConsentLog) hukuki ispat için hesap silme tamamlandıktan sonra aynı süre tutulur (bkz. Gizlilik Politikası m.3/m.5).
const CONSENT_RETENTION_MS = RETENTION_MS;
// Plus bekleme listesi e-postaları (pazarlama amaçlı) süresiz tutulmasın.
const WAITLIST_RETENTION_MS = RETENTION_MS;
// Usta notu kaldırma talebi: karar ve itiraz süreci kapandıktan 3 yıl sonra başvuranın kişisel verisi (ad, kurum, e-posta,
// telefon) anonimleştirilir; karar kaydı ve gerekçe (hukuki iz) korunur.
const TAKEDOWN_PII_RETENTION_MS = 3 * 365 * 24 * 60 * 60 * 1000;
const ANONIM = "[anonimleştirildi]";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!cronYetkili(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - RETENTION_MS);

    const [insuranceResult, saleResult] = await Promise.all([
      prisma.insuranceLead.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.saleLead.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    ]);

    const silinenKullanicilar = await prisma.dataDeletionRequest.findMany({
      where: { status: "COMPLETED", completedAt: { lt: new Date(Date.now() - CONSENT_RETENTION_MS) } },
      select: { userId: true },
    });
    const consentResult = silinenKullanicilar.length
      ? await prisma.consentLog.deleteMany({ where: { userId: { in: silinenKullanicilar.map((r) => r.userId) } } })
      : { count: 0 };

    const bekleme = await prisma.plusWaitlistEntry.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - WAITLIST_RETENTION_MS) } } });

    const takedown = await prisma.expertNoteTakedownRequest.updateMany({
      where: {
        status: { in: ["RESOLVED_REMOVED", "RESOLVED_CORRECTED", "RESOLVED_REJECTED", "RESOLVED_REPLY_GRANTED", "WITHDRAWN"] },
        appealStatus: { not: "PENDING" },
        updatedAt: { lt: new Date(Date.now() - TAKEDOWN_PII_RETENTION_MS) },
        claimantEmail: { not: ANONIM },
      },
      data: { claimantName: ANONIM, claimantOrg: null, claimantEmail: ANONIM, claimantPhone: null, claimantUserId: null },
    });

    return NextResponse.json({
      ok: true,
      deletedWaitlistEntries: bekleme.count,
      anonymizedTakedownRequests: takedown.count,
      deletedInsuranceLeads: insuranceResult.count,
      deletedSaleLeads: saleResult.count,
      deletedConsentLogs: consentResult.count,
      cutoff: cutoff.toISOString(),
    });
  } catch (err) {
    await cronHatasiBildir("cleanup-leads", err);
    return NextResponse.json({ error: "Temizlik başarısız oldu." }, { status: 500 });
  }
}
