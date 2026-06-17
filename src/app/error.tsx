"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-5xl font-black tracking-tight select-none">
        <span style={{ color: "#85B7EB" }}>5</span>
        <span style={{ color: "#97C459" }}>0</span>
        <span style={{ color: "#F0997B" }}>0</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-2">
        Bir şeyler ters gitti
      </h1>
      <p className="text-sm text-gray-500 mb-8 max-w-xs leading-relaxed">
        Beklenmedik bir hata oluştu. Tekrar dene veya ana sayfaya dön.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: "#111" }}
        >
          Tekrar dene
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-gray-400 transition-colors"
        >
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
