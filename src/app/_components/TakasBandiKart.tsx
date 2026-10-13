"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

// Ana sayfa "Takas Pazarı" bandının görünür kısmı. UstaBandi ile aynı kart düzeni; ek olarak
// "Gizle" düğmesi: kullanıcı bandı kapatabilir (tarayıcıda hatırlanır, hesap verisi değildir) —
// aynı mesajı her girişte dayatmayalım (bkz. kullanıcı dostu/kısıtlayıcı olmama ilkesi).
const ANAHTAR = "fikape:takas-bandi-gizli";
const OLAY = "fikape:takas-bandi-gizle";

function gizliMi(): boolean {
  try {
    return localStorage.getItem(ANAHTAR) === "1";
  } catch {
    return false; // gizli pencere / engelli depolama: bant görünür kalır
  }
}

function abone(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(OLAY, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(OLAY, cb);
  };
}

/** uye: panele giden varyant (garajında aracı olan üye); aksi hâlde tanıtım sayfasına giden varyant. */
export function TakasBandiKart({ uye, href }: { uye: boolean; href: string }) {
  // Sunucu çıktısında her zaman görünür; depolama okunduktan sonra gizlenir.
  const kayitliGizli = useSyncExternalStore(abone, gizliMi, () => false);
  const [yerelGizli, setYerelGizli] = useState(false);
  if (kayitliGizli || yerelGizli) return null;

  function gizle() {
    setYerelGizli(true); // depolama yazılamasa bile bu oturumda gizle
    try {
      localStorage.setItem(ANAHTAR, "1");
      window.dispatchEvent(new Event(OLAY));
    } catch {
      // yok sayılır
    }
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 pt-3">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <span aria-hidden="true">🔄</span> Takas Pazarı
        </h2>
        <button
          type="button"
          onClick={gizle}
          className="text-xs text-gray-500 hover:text-gray-800 min-h-8 px-2 -mr-2 rounded-lg"
          aria-label="Takas Pazarı bandını gizle"
        >
          Gizle
        </button>
      </div>
      <Link
        href={href}
        className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 min-h-11 border border-gray-100 bg-white transition-shadow hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ outlineColor: "var(--link)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-base"
            style={{ background: "var(--link-soft)" }}
            aria-hidden="true"
          >
            🤝
          </span>
          <span className="min-w-0">
            {uye ? (
              <>
                <span className="block text-sm font-semibold text-gray-900">Takas Panelinize göz atın</span>
                <span className="hidden sm:block text-xs text-gray-500 truncate">
                  İlanlarınızı, görüşmelerinizi ve kayıtlı aramalarınızı görün
                </span>
              </>
            ) : (
              <>
                <span className="block text-sm font-semibold text-gray-900">Aracınızı başka bir araçla takas edin</span>
                <span className="hidden sm:block text-xs text-gray-500 truncate">
                  Şartları ve adımları öğrenin, ilanları inceleyin
                </span>
              </>
            )}
          </span>
        </div>
        <span
          className="flex items-center gap-1 text-xs font-semibold rounded-xl px-4 py-2 shrink-0 text-white"
          style={{ background: "var(--btn-dark)" }}
        >
          {uye ? "Panelim" : "Nasıl çalışır"}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </section>
  );
}
