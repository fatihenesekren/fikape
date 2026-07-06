import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LeadStatusSelect } from "./LeadStatusSelect";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sigorta Talepleri",
  robots: { index: false },
};

export default async function AdminLeadsPage() {
  const leads = await prisma.insuranceLead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, displayName: true } },
      product: { select: { name: true, brand: { select: { name: true } }, model: { select: { name: true } } } },
    },
  }).catch(() => []);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-xl font-black text-gray-900 mb-1">🛡️ Sigorta Talepleri</h1>
      <p className="text-sm text-gray-500 mb-6">
        Garaj'dan gelen opt-in sigorta teklifi talepleri. Henüz aktif bir partner yok — bu liste ileride
        partnere manuel/toplu aktarılabilir.
      </p>

      {leads.length === 0 ? (
        <p className="text-sm text-gray-400">Henüz talep yok.</p>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
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
              <LeadStatusSelect id={lead.id} status={lead.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
