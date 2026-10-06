"use client";

import { useEffect, useRef, useState } from "react";
import { temizlemeZamaniEtiketi } from "@/lib/cacheZamani";

type Durum = "bosta" | "calisiyor" | "ok" | "hata";
export interface SonTemizleme { zaman: string; yonetici: string | null }

// "Cache Temizle" düğmesi — tarayıcı alert() yok; durum düğmenin kendisinde ve yanındaki role="status" alanında.
// variant "nav": masaüstü sidebar (altında "Son temizleme" satırı), "ikon": mobil başlık (yalnız ikon + ✓).
export function CacheTemizleButonu({ variant, son }: { variant: "nav" | "ikon"; son: SonTemizleme | null }) {
  const [durum, setDurum] = useState<Durum>("bosta");
  const [hata, setHata] = useState("");
  const [sonZaman, setSonZaman] = useState<SonTemizleme | null>(son);
  const [etiket, setEtiket] = useState("");
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Saat dilimi/hidrasyon farkı olmasın diye etiket yalnız istemcide, mount sonrası biçimlenir.
  useEffect(() => {
    setEtiket(sonZaman ? temizlemeZamaniEtiketi(new Date(sonZaman.zaman)) : "");
  }, [sonZaman]);

  useEffect(() => () => { if (zamanlayici.current) clearTimeout(zamanlayici.current); }, []);

  async function temizle() {
    if (durum === "calisiyor") return;
    setDurum("calisiyor");
    setHata("");
    try {
      const r = await fetch("/api/admin/revalidate", { method: "POST", headers: { "Content-Type": "application/json" } });
      const v = await r.json().catch(() => ({}));
      if (!r.ok || !v.ok) {
        setHata(r.status === 429 ? "Çok sık denediniz, biraz bekleyin." : r.status === 403 ? "Yetkiniz yok." : "Temizlenemedi, tekrar deneyin.");
        setDurum("hata");
        return;
      }
      setSonZaman({ zaman: v.zaman, yonetici: v.yonetici ?? null });
      setDurum("ok");
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      zamanlayici.current = setTimeout(() => setDurum("bosta"), 4000);
    } catch {
      setHata("Temizlenemedi, tekrar deneyin.");
      setDurum("hata");
    }
  }

  const calisiyor = durum === "calisiyor";
  const sonMetin = sonZaman ? `Son temizleme: ${etiket || "…"}${sonZaman.yonetici ? ` (${sonZaman.yonetici})` : ""}` : "Henüz temizlenmedi";
  const durumMetni = calisiyor ? "Temizleniyor…" : durum === "ok" ? "Önbellek temizlendi" : durum === "hata" ? hata : "";

  if (variant === "ikon") {
    return (
      <>
        <button
          onClick={temizle}
          disabled={calisiyor}
          aria-label={`Site verisi önbelleğini temizle. ${sonMetin}`}
          title={sonMetin}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {durum === "ok" ? "✓" : durum === "hata" ? "⚠️" : "🔄"}
        </button>
        <span role={durum === "hata" ? "alert" : "status"} aria-live="polite" className="sr-only">{durumMetni}</span>
      </>
    );
  }

  return (
    <div>
      <button
        onClick={temizle}
        disabled={calisiyor}
        title="Site verisi önbelleğini temizle (sayfalar, vitrin, katalog, öneriler)"
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors text-left disabled:opacity-60"
      >
        <span>{durum === "ok" ? "✓" : durum === "hata" ? "⚠️" : "🔄"}</span>
        <span>{calisiyor ? "Temizleniyor…" : durum === "ok" ? `Temizlendi ${etiket.replace(/^bugün /, "")}` : "Cache Temizle"}</span>
      </button>
      <p
        role={durum === "hata" ? "alert" : "status"}
        aria-live="polite"
        className={`px-3 text-[11px] leading-snug ${durum === "hata" ? "text-red-600" : "text-gray-400"}`}
      >
        {durum === "hata" ? hata : sonMetin}
      </p>
    </div>
  );
}
