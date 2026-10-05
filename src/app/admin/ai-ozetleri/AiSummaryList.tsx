"use client";

import { useState } from "react";
import Link from "next/link";
import { AiSummaryActions } from "./AiSummaryActions";

export interface AiSummaryItem {
  id: number;
  slug: string;
  title: string;
  searchText: string;
  summaryText: string;
  generatedLabel: string;
  modelVersion: string;
}

// Aksan/büyük-küçük harf duyarsız eşleşme ("ı"/"i", "ü"/"u" vb.).
function norm(s: string) {
  return s
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/\p{Mn}/gu, "");
}

export function AiSummaryList({ items }: { items: AiSummaryItem[] }) {
  const [search, setSearch] = useState("");
  const q = norm(search.trim());
  const filtered = q ? items.filter((s) => norm(s.searchText).includes(q)) : items;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Araç ara..."
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 flex-1 min-w-[160px]"
        />
        <span className="text-xs text-gray-400">
          {q ? `${filtered.length} / ${items.length} özet` : `${items.length} özet`}
        </span>
      </div>

      <div className="space-y-3">
        {filtered.map((s) => (
          <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/araclar/${s.slug}`} target="_blank" className="font-semibold text-gray-800 hover:underline">
                {s.title}
              </Link>
              <span className="text-[11px] text-gray-400">{s.modelVersion}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">
              {s.summaryText}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{s.generatedLabel}</span>
              <AiSummaryActions summaryId={s.id} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">Sonuç bulunamadı.</p>
        )}
      </div>
    </div>
  );
}
