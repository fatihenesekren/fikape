"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Category {
  slug: string;
  label: string;
  icon: string;
}

// Ana sayfada kategori seçimi artık sayfa içi grid'i büyütmüyor — her chip
// /araclar katalog sayfasına götürüyor (bkz. backlog_anasayfa_katalog_ayirma).
// "Tümü" ana sayfanın kürasyonlu görünümü olduğu için "/"ye bakar.
const CATEGORIES: Category[] = [
  { slug: "otomobil",    label: "Otomobil",   icon: "🚗" },
  { slug: "motosiklet",  label: "Motosiklet", icon: "🏍️" },
  { slug: "e-scooter",   label: "E-Scooter",  icon: "⚡" },
  { slug: "e-bisiklet",  label: "E-Bisiklet", icon: "🚴" },
  { slug: "karavan",     label: "Karavan",    icon: "🏕️" },
  { slug: "kamyonet",    label: "Kamyonet",   icon: "🛻" },
];

export function CategoryTabs({
  showQuizChip,
  quizActive = false,
}: {
  showQuizChip?: React.ReactNode;
  quizActive?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setFadeLeft(el.scrollLeft > 4);
    setFadeRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = scrollRef.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  return (
    <div className="relative">
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-none py-3">
        {showQuizChip}
        <Link
          href="/"
          prefetch
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 ${
            quizActive
              ? "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              : "border-gray-900 bg-gray-900 text-white"
          }`}
        >
          Tümü
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/araclar?kategori=${c.slug}`}
            prefetch
            className="shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            <span aria-hidden="true">{c.icon}</span>
            <span>{c.label}</span>
          </Link>
        ))}
      </div>

      {fadeLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent" aria-hidden="true" />
      )}
      {fadeRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" aria-hidden="true" />
      )}
    </div>
  );
}
