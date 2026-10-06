import type { SpecItem } from "@/lib/buildSpecList";
import { kisaUzunAyir } from "@/lib/specGridDuzen";

// Teknik özellik kutucukları — TEK KAYNAK. Hem araç detay sayfası
// (/araclar/[slug] "Teknik Özellikler" sekmesi) hem takas ilanı detayı
// (/takas/[id] "Özellikler" sekmesi) bunu kullanır. Önceden araç sayfası
// "label ..... value" satır tablosu, takas ise kutucuk gridiydi — takas
// görünümü daha derli toplu olduğu için o birleştirildi (bkz. kullanıcı
// geri bildirimi).

export function SpecGrid({
  items,
  emptyText = "Teknik özellik bulunamadı.",
}: {
  items: SpecItem[];
  emptyText?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">{emptyText}</p>;
  }
  // Uzun değerli kutular (bkz. specGridDuzen) kısa kutuların ardından tam genişlikte gösterilir;
  // böylece tek sütunda satırlara bölünüp komşu kutuları uzatmazlar.
  const { kisa, uzun } = kisaUzunAyir(items);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {kisa.map(({ label, value }) => (
        <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">
            {label}
          </div>
          <div className="text-sm font-semibold text-gray-900 mt-0.5 break-words">{value}</div>
        </div>
      ))}
      {uzun.map(({ label, value }) => (
        <div key={label} className="col-span-full bg-gray-50 rounded-lg px-3 py-2">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">
            {label}
          </div>
          <div className="text-sm font-semibold text-gray-900 mt-0.5 break-words">{value}</div>
        </div>
      ))}
    </div>
  );
}
