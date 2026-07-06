import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LeadStatusSelect } from "./LeadStatusSelect";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sigorta & Satış Talepleri",
  robots: { index: false },
};

const SALE_TYPE_LABEL: Record<string, string> = {
  EXPERTISE: "Ekspertiz Randevusu",
  QUICK_OFFER: "Hızlı Nakit Teklif",
};

export default async function AdminLeadsPage() {
  const [insuranceLeads, saleLeads, plusWaitlist] = await Promise.all([
    prisma.insuranceLead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, displayName: true } },
        product: { select: { name: true, brand: { select: { name: true } }, model: { select: { name: true } } } },
      },
    }).catch(() => []),
    prisma.saleLead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, displayName: true } },
        product: { select: { name: true, brand: { select: { name: true } }, model: { select: { name: true } } } },
      },
    }).catch(() => []),
    prisma.plusWaitlistEntry.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
  ]);

  return (
    <div className="p-8 max-w-4xl space-y-10">
      <div>
        <h1 className="text-xl font-black text-gray-900 mb-1">🛡️ Sigorta Talepleri</h1>
        <p className="text-sm text-gray-500 mb-6">
          Garaj'dan gelen opt-in sigorta teklifi talepleri. Henüz aktif bir partner yok — bu liste ileride
          partnere manuel/toplu aktarılabilir.
        </p>

        {insuranceLeads.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz talep yok.</p>
        ) : (
          <div className="space-y-2">
            {insuranceLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">
                    {lead.fullName} · <span className="font-normal text-gray-500">{lead.phone}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {lead.product.brand.name} {lead.product.model.name} — {lead.user.displayName ?? lead.user.email}
                  </div>
                  <div className="text-[11px] text-gray-300 mt-0.5">
                    {lead.createdAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
                <LeadStatusSelect id={lead.id} status={lead.status} kind="insurance" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-xl font-black text-gray-900 mb-1">🔧 Satış Anı Talepleri</h1>
        <p className="text-sm text-gray-500 mb-6">
          "Sattım" formunu açarken gelen opt-in ekspertiz/hızlı teklif talepleri. Henüz aktif bir partner yok.
        </p>

        {saleLeads.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz talep yok.</p>
        ) : (
          <div className="space-y-2">
            {saleLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">
                    {lead.fullName} · <span className="font-normal text-gray-500">{lead.phone}</span>
                    <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      {SALE_TYPE_LABEL[lead.type] ?? lead.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {lead.product.brand.name} {lead.product.model.name} — {lead.user.displayName ?? lead.user.email}
                  </div>
                  <div className="text-[11px] text-gray-300 mt-0.5">
                    {lead.createdAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
                <LeadStatusSelect id={lead.id} status={lead.status} kind="sale" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-xl font-black text-gray-900 mb-1">✨ Fikape Plus Bekleme Listesi</h1>
        <p className="text-sm text-gray-500 mb-6">
          Gerçek ödeme yok — sadece talep sinyali. Liste büyüdükçe Stripe/iyzico entegrasyonu değerlendirilecek.
        </p>

        {plusWaitlist.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz kayıt yok.</p>
        ) : (
          <div className="space-y-2">
            {plusWaitlist.map((entry) => (
              <div key={entry.id} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="font-semibold text-gray-900 text-sm">{entry.email}</div>
                {entry.note && <div className="text-xs text-gray-500 mt-0.5">{entry.note}</div>}
                <div className="text-[11px] text-gray-300 mt-0.5">
                  {entry.createdAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
