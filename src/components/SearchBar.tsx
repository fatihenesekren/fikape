"use client";

import { useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export function SearchBar() {
  const router   = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  // Ana sayfada hero'nun kendi search kutusu var — başlıkta tekrar gösterme
  if (pathname === "/") return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (q) router.push(`/arama?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 max-w-sm mx-4 hidden sm:flex items-center"
    >
      <div className="relative w-full">
        <input
          ref={inputRef}
          name="q"
          type="search"
          placeholder="Araç, marka veya model ara..."
          className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
        />
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle cx={11} cy={11} r={8} />
          <path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
      </div>
    </form>
  );
}

/* Mobil için sadece ikon — header'da yer kaplamaması için */
export function SearchIcon() {
  const router   = useRouter();
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <button
      onClick={() => router.push("/arama")}
      className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
      aria-label="Ara"
    >
      <svg
        className="w-5 h-5"
        fill="none" stroke="currentColor" strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx={11} cy={11} r={8} />
        <path strokeLinecap="round" d="m21 21-4.35-4.35" />
      </svg>
    </button>
  );
}
