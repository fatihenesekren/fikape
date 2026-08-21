import Link from "next/link";

// Arama sonuçlarında istenen aracı bulamayan kullanıcı, listede olanlardan
// birini seçmeye "zorlanmış" hissediyordu (bkz. kullanıcı geri bildirimi —
// "2014 Polo" aradı, sonuçta sadece "2017 Polo" vardı). VehicleCard'la aynı
// boyut/şekilde bir kart, sonuç ızgarasının sonuna eklenerek "aslında
// aradığın bu olmayabilir, öner" seçeneğini görünür ve erişilebilir kılıyor —
// ayrı bir banner yerine ızgaranın doğal bir parçası olarak.
export function SuggestVehicleCard({ query }: { query: string }) {
  return (
    <Link
      href={`/oner?brandName=${encodeURIComponent(query)}`}
      className="group flex flex-col items-center justify-center text-center bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-colors overflow-hidden h-full min-h-[280px] px-6 py-8"
    >
      <span
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-gray-400 group-hover:text-gray-600 group-hover:scale-105 transition-all mb-3"
        style={{ background: "#F3F4F6" }}
      >
        +
      </span>
      <p className="text-sm font-bold text-gray-900">Aradığını bulamadın mı?</p>
      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
        &ldquo;{query}&rdquo; listede tam istediğin gibi yoksa,<br />aracı öner — kataloğa ekleyelim.
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-white px-3.5 py-2 rounded-xl transition-colors" style={{ background: "#111" }}>
        + Araç Öner
      </span>
    </Link>
  );
}
