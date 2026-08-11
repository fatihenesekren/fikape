import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DeletionRequestActions } from "./DeletionRequestActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Hesap Silme Talepleri — Admin", robots: { index: false } };

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

export default async function DeletionRequestsPage() {
  const requests = await prisma.dataDeletionRequest.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { displayName: true, email: true } } },
    orderBy: { requestedAt: "asc" },
  }).catch(() => []);

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900 mb-1">🗑️ Hesap Silme Talepleri</h1>
        <p className="text-sm text-gray-500">
          KVKK: talepler en geç 30 gün içinde işleme alınmalıdır. Onaylama hesabı anonimleştirir
          (e-posta/ad/şifre) ve aktif takas ilanlarını/mesajlarını temizler — geri alınamaz.
        </p>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-gray-400">Bekleyen talep yok.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => {
            const daysLeft = daysUntil(r.dueAt);
            return (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-800">{r.user.displayName ?? r.user.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {r.requestedAt.toLocaleDateString("tr-TR")} tarihinde talep edildi —{" "}
                  <span className={daysLeft <= 5 ? "text-red-600 font-semibold" : ""}>
                    son {daysLeft} gün
                  </span>
                </p>
                {r.reason && <p className="text-xs text-gray-500 mt-1">&quot;{r.reason}&quot;</p>}
                <div className="mt-2">
                  <DeletionRequestActions requestId={r.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
