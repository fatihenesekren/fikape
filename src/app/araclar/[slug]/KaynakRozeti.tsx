"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { GorselKredisi } from "@/lib/gorselKredisi";

interface Props {
  label: string;
  /** Yalnız katalog karesinde: yazar + lisans (CC atıf yükümlülüğü). Yoksa sade etiket. */
  atif?: GorselKredisi | null;
}

/** Fotoğrafın sol altındaki kaynak etiketi; atıf varsa yazar + lisans her zaman görünür, ⓘ ile bağlantılı ayrıntı açılır. */
export function KaynakRozeti({ label, atif }: Props) {
  const [acik, setAcik] = useState(false);
  const kap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik) return;
    const disTik = (e: MouseEvent | TouchEvent) => {
      if (kap.current && !kap.current.contains(e.target as Node)) setAcik(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(false); };
    document.addEventListener("mousedown", disTik);
    document.addEventListener("touchstart", disTik);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", disTik);
      document.removeEventListener("touchstart", disTik);
      document.removeEventListener("keydown", esc);
    };
  }, [acik]);

  if (!atif) {
    return (
      <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs font-medium z-10">
        📸 {label}
      </div>
    );
  }

  return (
    <div ref={kap} className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-6rem)]">
      {acik && (
        <div
          role="dialog"
          aria-label="Fotoğraf atfı"
          className="absolute bottom-full left-0 mb-2 w-72 max-w-[calc(100vw-3rem)] rounded-xl bg-black/85 text-white text-xs leading-relaxed p-3 shadow-lg break-words"
        >
          <p className="font-semibold mb-1">Katalog fotoğrafı</p>
          <p>
            Yazar:{" "}
            {atif.kaynakUrl ? (
              <a href={atif.kaynakUrl} target="_blank" rel="noopener noreferrer" className="underline">{atif.yazar}</a>
            ) : atif.yazar}
          </p>
          <p>
            Lisans:{" "}
            {atif.lisansUrl ? (
              <a href={atif.lisansUrl} target="_blank" rel="noopener noreferrer license" className="underline">{atif.lisans}</a>
            ) : atif.lisans}
          </p>
          <Link href="/gorsel-kaynaklari" className="underline block mt-1">Görsel kaynakları</Link>
        </div>
      )}
      <div className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-black/55 text-white text-xs font-medium min-w-0">
        <span className="shrink-0">📸 {label}</span>
        <span aria-hidden="true" className="shrink-0 opacity-60">·</span>
        <span className="truncate min-w-0 opacity-90">{atif.yazar}</span>
        <span aria-hidden="true" className="shrink-0 opacity-60">·</span>
        <span className="shrink-0 opacity-90">{atif.lisans}</span>
        <button
          type="button"
          onClick={() => setAcik((v) => !v)}
          aria-expanded={acik}
          aria-label="Fotoğraf atfı ayrıntısı"
          className="shrink-0 ml-0.5 w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 text-[11px]"
        >
          ⓘ
        </button>
      </div>
    </div>
  );
}
