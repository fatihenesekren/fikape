"use client";

import Link from "next/link";

// Mobilde sidebar'ın alt kısmındaki "Cache Temizle" / "Siteye Dön" öğeleri
// alt tab bar'a 5. öğe olarak sıkıştırılmıyor — ayrı bir üst şeride taşındı.
export function AdminMobileHeader() {
  async function handleRevalidate() {
    await fetch("/api/admin/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    alert("Cache temizlendi.");
  }

  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
      <Link href="/" className="flex items-baseline gap-1.5 text-sm font-black tracking-tight">
        <span>
          <span style={{ color: "#0C447C" }}>fi</span>
          <span style={{ color: "#27500A" }}>·ka·</span>
          <span style={{ color: "#712B13" }}>pe</span>
        </span>
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Admin</span>
      </Link>
      <div className="flex items-center gap-1">
        <button
          onClick={handleRevalidate}
          aria-label="Cache temizle"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
        >
          🔄
        </button>
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
