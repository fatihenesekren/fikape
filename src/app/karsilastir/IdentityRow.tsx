import Image from "next/image";
import Link from "next/link";
import type { CompareProductView } from "./CompareResultsGrid";
import { zebraColumnBg } from "@/lib/compare/zebraColumn";

// Sahibinden Oto360 referansına göre: araç görseli+adı artık ayrı bir "kart"
// değil, birleşik tablonun İLK satırı — kullanıcının istediği "1 aracın boydan
// boya bir kolonu var" hissi bununla sağlanıyor (tek <table>, kesintisiz sütun).
// Etiket sütununda bu satır için anlamlı bir metin yok (sahibinden'de de boş) —
// sr-only "Araç" ile ekran okuyucuya bağlam veriliyor.
export function IdentityRow({ products }: { products: CompareProductView[] }) {
  return (
    <tr className="border-b border-gray-200">
      <th scope="row" className="sticky left-0 bg-gray-50 px-3 py-3 align-top">
        <span className="sr-only">Araç</span>
      </th>
      {products.map((p, i) => (
        <td key={p.slug} className={`${zebraColumnBg(i)} px-3 py-3 align-top`}>
          {p.imageUrl && (
            <div className="relative w-full aspect-[4/3] mb-2 rounded-xl overflow-hidden bg-gray-50 max-w-[160px]">
              <Image src={p.imageUrl} alt={p.altText} fill className="object-contain p-2" sizes="160px" />
            </div>
          )}
          {/* break-words: marka adı ("VOLKSWAGEN" gibi) TEK KELİME, normal
              satır kırma noktası yok — dar mobil sütunlarda (3-4 araç) komşu
              hücrenin üzerine taşıyordu (SpecRows.tsx'teki "Elektrikli" ile
              AYNI hata sınıfı, ama bu satırda eksik kalmıştı — gerçek
              kullanıcı ekran görüntüsüyle doğrulandı). */}
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5 break-words">{p.brandName}</div>
          <Link href={`/araclar/${p.slug}`} className="font-bold text-gray-900 hover:underline text-sm line-clamp-2 break-words">
            {p.displayName}{p.year ? ` ${p.year}` : ""}
          </Link>
          {p.subtitle && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 break-words">{p.subtitle}</p>}
        </td>
      ))}
    </tr>
  );
}
