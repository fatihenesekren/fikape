import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// KVKK saklama süresi sınırlaması ilkesi — sigorta/satış lead'leri (telefon
// içeriyor) süresiz tutulmasın diye. Şu an aktif bir partner olmadığından
// (bkz. InsuranceLeadCard/SaleLeadCard metinleri) 2 yıl, 5651 trafik logu
// için kullanılan üst sınırla tutarlı, konservatif bir varsayılan.
const RETENTION_MS = 2 * 365 * 24 * 60 * 60 * 1000; // 2 yıl

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - RETENTION_MS);

    const [insuranceResult, saleResult] = await Promise.all([
      prisma.insuranceLead.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.saleLead.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    ]);

    return NextResponse.json({
      ok: true,
      deletedInsuranceLeads: insuranceResult.count,
      deletedSaleLeads: saleResult.count,
      cutoff: cutoff.toISOString(),
    });
  } catch (err) {
    console.error("cleanup-leads failed:", err);
    return NextResponse.json({ error: "Temizlik başarısız oldu." }, { status: 500 });
  }
}
