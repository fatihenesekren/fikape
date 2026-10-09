"use client";

import { useRef } from "react";
import { VoiceMicButton } from "@/components/VoiceMicButton";
import { aramaDurumu } from "@/lib/aramaDurumu";

export function AramaSearchBox({ query, ortali = false }: { query: string; ortali?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Mobilde klavyenin kendiliğinden açılması yalnız arama ekranı boşken istenir (arama simgesinden gelen kullanıcı yazmaya hazırdır)
  // İpucu yalnız kullanıcı gerçekten 1 karakter yazıp gönderdiyse görünür (boş açılışta hata gibi durmasın).
  const ipucu = aramaDurumu(query).durum === "kisa" && query.length > 0;

  return (
    <form ref={formRef} action="/arama" method="GET" role="search" className={ortali ? "mt-6" : "mb-6"}>
      <div className={ortali ? "relative max-w-2xl mx-auto" : "relative max-w-xl"}>
        <input
          ref={inputRef}
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Marka veya model ara..."
          aria-label="Araç ara"
          aria-describedby={ipucu ? "arama-ipucu" : undefined}
          aria-invalid={ipucu || undefined}
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus={!query}
          className={`voice-mic-input w-full pl-10 pr-36 rounded-2xl border border-gray-300 bg-white text-base placeholder-gray-500 focus:outline-none focus:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-900/25 transition-colors ${ortali ? "py-4 shadow-md" : "py-3.5 sm:text-sm shadow-sm"}`}
        />
        <svg
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <circle cx={11} cy={11} r={8} />
          <path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
        <VoiceMicButton inputRef={inputRef} formRef={formRef} rightPx={84} buyuk />
        <button
          type="submit"
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 ${ortali ? "h-11" : "h-10"} px-5 rounded-xl text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2`}
          style={{ background: "#111" }}
        >
          Ara
        </button>
      </div>
      {ipucu && (
        <div className={ortali ? "max-w-2xl mx-auto" : "max-w-xl"}>
          <p
            id="arama-ipucu"
            role="status"
            className={ortali
              ? "mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-center"
              : "text-xs text-gray-600 mt-2 pl-1"}
          >
            Aramak için en az 2 karakter girin.
          </p>
        </div>
      )}
    </form>
  );
}
