"use client";

import Link from "next/link";
import { CacheTemizleButonu, type SonTemizleme } from "./CacheTemizleButonu";

// Mobilde sidebar'ın alt kısmındaki "Cache Temizle" / "Siteye Dön" öğeleri
// alt tab bar'a 5. öğe olarak sıkıştırılmıyor — ayrı bir üst şeride taşındı.
export function AdminMobileHeader({ sonTemizleme }: { sonTemizleme: SonTemizleme | null }) {
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
      <Link href="/" className="flex items-baseline gap-1.5 text-sm font-black tracking-tight">
        <span>
          <span className="text-fi">fi</span>
          <span className="text-ka">·ka·</span>
          <span className="text-pe">pe</span>
        </span>
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Admin</span>
      </Link>
      <div className="flex items-center gap-1">
        <CacheTemizleButonu variant="ikon" son={sonTemizleme} />
        <Link
          href="/"
          aria-label="Siteye dön"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
        >
          ←
        </Link>
      </div>
    </div>
  );
}
