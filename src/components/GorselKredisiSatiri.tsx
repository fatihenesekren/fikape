import Link from "next/link";
import type { GorselKredisi } from "@/lib/gorselKredisi";

/** Katalog görselinin yazar + lisans satırı (CC atıf yükümlülüğü). */
export function GorselKredisiSatiri({ kredi }: { kredi: GorselKredisi }) {
  return (
    <p className="max-w-5xl mx-auto px-4 py-2 text-[11px] leading-relaxed text-gray-400 break-words">
      Katalog fotoğrafı:{" "}
      {kredi.kaynakUrl ? (
        <a href={kredi.kaynakUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">{kredi.yazar}</a>
      ) : (
        kredi.yazar
      )}
      {" · "}
      {kredi.lisansUrl ? (
        <a href={kredi.lisansUrl} target="_blank" rel="noopener noreferrer license" className="underline hover:text-gray-600">{kredi.lisans}</a>
      ) : (
        kredi.lisans
      )}
      {" · "}
      <Link href="/gorsel-kaynaklari" className="underline hover:text-gray-600">Görsel kaynakları</Link>
    </p>
  );
}
