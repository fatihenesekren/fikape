"use client";

import { useRef } from "react";
import { VoiceMicButton } from "@/components/VoiceMicButton";
import { aramaDurumu } from "@/lib/aramaDurumu";

export function AramaSearchBox({ query }: { query: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Mobilde klavyenin kendiliğinden açılması yalnız arama ekranı boşken istenir (arama simgesinden gelen kullanıcı yazmaya hazırdır)
  const ipucu = aramaDurumu(query).durum === "kisa";

  return (
    <form ref={formRef} action="/arama" method="GET" role="search" className="mb-6">
      <div className="relative max-w-xl">
        <input
          ref={inputRef}
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Marka, model veya araç adı ara..."
          aria-label="Araç ara"
          aria-describedby={ipucu ? "arama-ipucu" : undefined}
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus={!query}
          className="voice-mic-input w-full pl-10 pr-36 py-3.5 rounded-2xl border border-gray-300 bg-white text-base sm:text-sm shadow-sm placeholder-gray-500 focus:outline-none focus:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-900/25 transition-colors"
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
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-10 px-5 rounded-xl text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          style={{ background: "#111" }}
        >
          Ara
        </button>
      </div>
      {ipucu && (
        <p id="arama-ipucu" role="status" className="text-xs text-gray-600 mt-2 pl-1">En az 2 karakter girin.</p>
      )}
    </form>
  );
}
