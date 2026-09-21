"use client";

import { useRef } from "react";
import { VoiceMicButton } from "@/components/VoiceMicButton";

export function AraclarSearchBox({ catSlug, q }: { catSlug?: string; q: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action="/araclar" method="GET" className="mb-6">
      {catSlug && <input type="hidden" name="kategori" value={catSlug} />}
      <div className="relative max-w-xl">
        <input
          ref={inputRef}
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Marka, model veya araç adı ara"
          className="w-full pl-4 pr-28 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
        />
        <VoiceMicButton inputRef={inputRef} formRef={formRef} rightPx={68} />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: "#111" }}
        >
          Ara
        </button>
      </div>
    </form>
  );
}
