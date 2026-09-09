"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Confirm = "close" | "block" | null;

interface Props {
  threadId: number;
  interestLostByMe: boolean;
  isClosed: boolean;        // soft-close veya engel
  blockedByMe: boolean;
  closedByMeCount: number;   // eskalasyon uyarısı için
}

export function ThreadActions({ threadId, interestLostByMe, isClosed, blockedByMe, closedByMeCount }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function post(path: string, key: string) {
    setLoading(key);
    try {
      const res = await fetch(`/api/trades/threads/${threadId}/${path}`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
      setMenuOpen(false);
      setConfirm(null);
    }
  }

  const escalate = closedByMeCount >= 2 && !blockedByMe;

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
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 text-left">
          {interestLostByMe ? (
            <button
              type="button"
              onClick={() => post("interest-regained", "regain")}
              disabled={loading !== null}
              className="w-full px-4 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <p className="text-sm text-gray-700">Yeniden ilgileniyorum</p>
              <p className="text-[11px] text-gray-400">Karşı tarafa bildirilir</p>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => post("interest-lost", "lost")}
              disabled={loading !== null}
              className="w-full px-4 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <p className="text-sm text-gray-700">İlgilenmiyorum</p>
              <p className="text-[11px] text-gray-400">Görüşme açık kalır, sadece sinyal verir</p>
            </button>
          )}

          <div className="border-t border-gray-100 my-1" />

          {!isClosed && (
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setConfirm("close"); }}
              disabled={loading !== null}
              className="w-full px-4 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <p className="text-sm text-gray-700">Görüşmeyi kapat</p>
              <p className="text-[11px] text-gray-400">İkiniz de yazamazsınız · geri alınabilir</p>
            </button>
          )}

          {!blockedByMe && (
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setConfirm("block"); }}
              disabled={loading !== null}
              className={`w-full px-4 py-2.5 transition-colors disabled:opacity-60 ${escalate ? "bg-red-50/60 hover:bg-red-50" : "hover:bg-red-50"}`}
            >
              <p className="text-sm text-red-600">Kişiyi engelle</p>
              <p className="text-[11px] text-red-400">
                {escalate
                  ? `Bu kişiyle ${closedByMeCount} görüşme kapattın — engellemek ister misin?`
                  : "Hiçbir ilandan sana ulaşamaz"}
              </p>
            </button>
          )}
        </div>
      )}

      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6"
          onClick={() => setConfirm(null)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 text-left" onClick={(e) => e.stopPropagation()}>
            {confirm === "close" ? (
              <>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">Görüşmeyi kapat</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Bu görüşme arşivlenir, ikiniz de yazamazsınız. Kişi engellenmez — istersen daha sonra yeniden açabilirsin. Karşı tarafa bilgi verilir.
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => setConfirm(null)} className="text-xs text-gray-400 hover:underline px-2">Vazgeç</button>
                  <button
                    onClick={() => post("close", "close")}
                    disabled={loading !== null}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-60 transition-colors"
                  >
                    {loading === "close" ? "Kapatılıyor..." : "Görüşmeyi kapat"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">Kişiyi engelle</h3>
                <p className="text-sm text-gray-500 mb-4">
                  <strong className="text-gray-700">{"Bu kullanıcı seninle hiçbir ilan üzerinden iletişim kuramaz"}</strong> ve sen de ona yazamazsın. Bu görüşme de kapanır. Engeli <strong className="text-gray-700">Profil › Engellenen kullanıcılar</strong>&apos;dan kaldırabilirsin. Karşı tarafa bildirim gitmez.
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => setConfirm(null)} className="text-xs text-gray-400 hover:underline px-2">Vazgeç</button>
                  <button
                    onClick={() => post("block", "block")}
                    disabled={loading !== null}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
                  >
                    {loading === "block" ? "İşleniyor..." : "Engelle"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
