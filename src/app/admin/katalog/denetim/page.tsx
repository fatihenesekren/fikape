import { prisma } from "@/lib/prisma";
import { AltMenu } from "../AltMenu";

export const metadata = { title: "Denetim Kaydı — Katalog Yönetimi" };
export const dynamic = "force-dynamic";

const EYLEM_ETIKETI: Record<string, string> = {
  PRODUCT_CREATE: "Araç eklendi", PRODUCT_UPDATE: "Araç düzeltildi", PRODUCT_DEACTIVATE: "Araç pasife alındı",
  PRODUCT_REACTIVATE: "Araç geri alındı", PRODUCT_DELETE: "Araç silindi",
  BRAND_RENAME: "Marka yeniden adlandırıldı", MODEL_RENAME: "Model yeniden adlandırıldı",
  BRAND_MERGE: "Markalar birleştirildi", MODEL_MERGE: "Modeller birleştirildi",
  OVERRIDE_HIDE: "Resmi katalogdan gizlendi", OVERRIDE_RESTORE: "Gizleme kaldırıldı",
};

export default async function DenetimPage() {
  const kayitlar = await prisma.catalogAuditLog.findMany({ orderBy: { id: "desc" }, take: 100 });
  return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl">
      <AltMenu aktif="/admin/katalog/denetim" />
      <p className="text-xs text-gray-400 mb-3">Son {kayitlar.length} işlem</p>
      <ul className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-xl">
        {kayitlar.map((k) => (
          <li key={k.id} className="px-4 py-3">
            <p className="text-sm font-medium text-gray-900">{EYLEM_ETIKETI[k.action] ?? k.action}</p>
            <p className="text-sm text-gray-600 break-words">{k.entityLabel ?? `${k.entityType} #${k.entityId ?? "?"}`}</p>
            <p className="text-xs text-gray-400">{k.adminLabel ?? "?"} · {k.createdAt.toLocaleString("tr-TR")}</p>
          </li>
        ))}
        {kayitlar.length === 0 && <li className="px-4 py-8 text-sm text-gray-400 text-center">Henüz kayıt yok.</li>}
      </ul>
    </div>
  );
}
