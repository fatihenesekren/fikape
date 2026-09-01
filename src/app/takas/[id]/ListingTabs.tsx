"use client";

import { useState, type ReactNode } from "react";

interface Tab {
  key: string;
  label: string;
  icon?: string;
  content: ReactNode;
}

// Araç sayfasındaki TabView.tsx araca özel prop'lara (rapor listeleri vb.)
// sıkı bağlı olduğu için doğrudan yeniden kullanılamadı — aynı görsel dilde
// (border-b sekme başlıkları, rounded-b-2xl içerik kutusu) sade bir versiyonu.
export function ListingTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const activeTab = tabs.find((t) => t.key === active);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4">
      {/* Kısa etiketler + min-w-0 bile en dar telefonlarda (320-360px) 4 sekmeyi
          taşırabiliyordu — whitespace-nowrap'li metin, kutusu küçülse de kendi
          sınırının dışına taşabiliyor (bkz. kullanıcı geri bildirimi, ekran
          görüntüsü). Mobilde ikon üstte + etiket altta (dikey istif) — bottom-nav
          uygulamalarındaki desen, yatayda ikon+etiket toplamı yerine sadece en
          geniş satırın genişliği gerekiyor, etiket hiç kırpılmadan her zaman
          görünür kalıyor. `sm:` ve üstünde yeterli yer olduğu için ikon+etiket
          yan yana (satır) düzenine dönüyor — masaüstünde zaten sorun yoktu. */}
      <div className="flex border-b border-gray-100 bg-gray-50/60">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`min-w-0 flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-1 sm:px-2 py-2 sm:py-2.5 text-[11px] sm:text-sm font-semibold border-b-2 transition-colors ${
              active === tab.key
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.icon && <span aria-hidden="true" className="text-base sm:text-[15px] leading-none">{tab.icon}</span>}
            <span className="whitespace-nowrap leading-tight">{tab.label}</span>
          </button>
        ))}
      </div>
      <div key={activeTab?.key} className="p-4 min-h-[120px] animate-tab-fade-in">
        {activeTab?.content}
      </div>
    </div>
  );
}
