import Link from "next/link";

const SEKMELER = [
  { href: "/admin/katalog", etiket: "Araçlar" },
  { href: "/admin/katalog/yeni", etiket: "Yeni araç" },
  { href: "/admin/katalog/marka-model", etiket: "Marka / Model" },
  { href: "/admin/katalog/denetim", etiket: "Denetim kaydı" },
];

export function AltMenu({ aktif }: { aktif: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Katalog Yönetimi</h1>
      <div className="flex flex-wrap gap-2">
        {SEKMELER.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              aktif === s.href ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s.etiket}
          </Link>
        ))}
      </div>
    </div>
  );
}
