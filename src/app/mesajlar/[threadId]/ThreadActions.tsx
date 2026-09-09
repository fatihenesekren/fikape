"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function ThreadActions({ threadId, showInterestLost }: { threadId: number; showInterestLost: boolean }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [loading, setLoading] = useState<"block" | "interest-lost" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function post(path: "block" | "interest-lost") {
    setLoading(path);
    try {
      const res = await fetch(`/api/trades/threads/${threadId}/${path}`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
      setMenuOpen(false);
      setConfirmEnd(false);
    }
  }

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Görüşme işlemleri"
        aria-expanded={menuOpen}
        className="p-1.5 -mr-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
          {showInterestLost && (
            <button
              type="button"
              onClick={() => post("interest-lost")}
              disabled={loading !== null}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              İlgimi kaybettim
            </button>
          )}
          <button
            type="button"
            onClick={() => { setMenuOpen(false); setConfirmEnd(true); }}
            disabled={loading !== null}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            Görüşmeyi sonlandır
          </button>
        </div>
      )}

      {confirmEnd && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6"
          onClick={() => setConfirmEnd(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 text-left" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">Görüşmeyi sonlandır</h3>
            <p className="text-sm text-gray-500 mb-4">
              Bu görüşme kapanır ve bu kullanıcıyla bir daha mesajlaşamazsınız. Bu işlem geri alınamaz.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setConfirmEnd(false)}
                className="text-xs text-gray-400 hover:underline px-2"
              >
                Vazgeç
              </button>
              <button
                onClick={() => post("block")}
                disabled={loading !== null}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {loading === "block" ? "İşleniyor..." : "Sonlandır"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
