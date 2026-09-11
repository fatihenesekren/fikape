"use client";

import { useState } from "react";
import Link from "next/link";
import type { RegionalSummary } from "@/lib/expertRegional";

// Bölgesel görünürlük yüzeyi — 3 tasarım önerisinin (editoryal / kompakt-
// metadata / kademeli-açılma) sentezi: varsayılan KAPALI ince şerit (minimal
// ayak izi, not listesiyle rekabet etmez) + açılınca not-önizlemeli liste
// (kimlik değil KATKI birincil). Kesin kurallar: telefon/adres/CTA yok,
// "size özel" değil, sıra etiketi dürüst ve görünür, veri yoksa render edilmez.
export function RegionalExpertsBlock({ summary }: { summary: RegionalSummary | null }) {
  const [open, setOpen] = useState(false);
  if (!summary || summary.entries.length === 0) return null;

  const heading = summary.city
    ? `${summary.city} çevresinde bu modele not yazan ustalar`
    : "Türkiye genelinde bu modele not yazan ustalar";

  return (
    <div className="border-b border-gray-50 bg-gray-50/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-5 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm shrink-0">🔧</span>
        <span className="flex-1 text-xs text-gray-500 truncate">
          <span className="text-gray-700 font-medium">{summary.totalExperts}</span> usta
          {summary.city ? ` · ${summary.city} çevresinde` : ""} bu modele not yazdı
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-3 space-y-2">
          <p className="text-[11px] text-gray-500 font-medium">{heading}</p>
          <p className="text-[11px] text-gray-400">{summary.sortLabel}</p>
          <ul className="space-y-1">
            {summary.entries.map((e) => (
              <li key={e.noteId}>
                <Link
                  href={`#usta-not-${e.noteId}`}
                  className="flex items-baseline gap-1.5 rounded-lg -mx-1.5 px-1.5 py-1 text-xs hover:bg-white transition-colors"
                >
                  <span className="font-medium shrink-0" style={{ color: "#7A3E00" }}>
                    {e.authorName}
                  </span>
                  <span className="text-gray-400 truncate">— {e.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
