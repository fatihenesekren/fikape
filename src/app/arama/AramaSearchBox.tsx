"use client";

import { useRef } from "react";
import { VoiceMicButton } from "@/components/VoiceMicButton";

export function AramaSearchBox({ query }: { query: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action="/arama" method="GET" className="mb-8">
      <div className="relative max-w-xl">
        <input
          ref={inputRef}
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Marka, model veya araç adı ara..."
          autoFocus={!query}
          className="voice-mic-input w-full pl-10 pr-32 py-3 rounded-2xl border border-gray-200 bg-white text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
        />
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <circle cx={11} cy={11} r={8} />
          <path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
        <VoiceMicButton inputRef={inputRef} formRef={formRef} rightPx={74} />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: "#111" }}
        >
          Ara
        </button>
      </div>
      {query.length > 0 && query.length < 2 && (
        <p className="text-xs text-gray-400 mt-2 pl-1">En az 2 karakter gir.</p>
      )}
    </form>
  );
}
