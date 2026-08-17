"use client";

import { useState, type ReactNode } from "react";

interface Tab {
  key: string;
  label: string;
  content: ReactNode;
}

// Araç sayfasındaki TabView.tsx araca özel prop'lara (rapor listeleri vb.)
// sıkı bağlı olduğu için doğrudan yeniden kullanılamadı — aynı görsel dilde
// (border-b sekme başlıkları, rounded-b-2xl içerik kutusu) sade bir versiyonu.
export function ListingTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4">
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-1 px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              active === tab.key
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4 min-h-[120px]">
        {tabs.find((t) => t.key === active)?.content}
      </div>
    </div>
  );
}
