"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

// Profil "Tercihlerim" satırı: başlık + açıklama solda, anahtar sağda. Durum sunucuda kaydedilince değişir
// (rıza gibi hukuki tercihlerde ekran, kaydedilmeden "açık" görünmemeli). Yerel alert/confirm yok;
// durum ve hata satır içinde, ekran okuyucuya role="status"/"alert" ile duyurulur.
type Props = {
  title: string;
  description: ReactNode;
  /** Açıklamanın altında katlanabilir ek bilgi (ör. neler paylaşılır). */
  details?: { summary: string; body: ReactNode };
  endpoint: string;
  initialEnabled: boolean;
  onText?: string;
  offText?: string;
  savedText?: string;
  errorText?: string;
  /** Satır sonu küçük not (ör. son değişiklik tarihi). */
  footnote?: ReactNode;
  /** Kayıt başarıyla tamamlanınca yeni durumla çağrılır (üst bileşen özet satırını günceller). */
  onChange?: (enabled: boolean) => void;
};

type Status = "idle" | "saving" | "saved" | "error";

export function PreferenceSwitch({
  title, description, details, endpoint, initialEnabled,
  onText = "Açık", offText = "Kapalı",
  savedText = "Tercihiniz kaydedildi.",
  errorText = "Tercihiniz kaydedilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.",
  footnote,
  onChange,
}: Props) {
  const id = useId();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function toggle() {
    if (status === "saving") return; // çift tıklama: aria-disabled kullanıldığı için odak kaybolmaz
    const next = !enabled;
    setStatus("saving");
    setMessage("Kaydediliyor…");
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (res.ok) {
        setEnabled(next);
        onChange?.(next);
        setStatus("saved");
        setMessage(savedText);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => { setStatus("idle"); setMessage(""); }, 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(typeof data.error === "string" && data.error ? data.error : errorText);
      }
    } catch {
      setStatus("error");
      setMessage(errorText);
    }
  }

  const saving = status === "saving";

  return (
    <div className="px-5 py-4 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p id={`${id}-t`} className="text-sm font-medium text-gray-900">{title}</p>
          <div id={`${id}-d`} className="mt-0.5 text-xs leading-relaxed text-gray-600">{description}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
          <span className="text-xs font-medium text-gray-600" aria-hidden="true">{enabled ? onText : offText}</span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-labelledby={`${id}-t`}
            aria-describedby={`${id}-d ${id}-s`}
            aria-disabled={saving}
            aria-busy={saving}
            onClick={toggle}
            className={`relative -m-2 box-content h-6 w-11 shrink-0 rounded-full border-8 border-transparent bg-clip-padding transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-link forced-colors:border-[CanvasText] ${enabled ? "bg-ka" : "bg-gray-500"} ${saving ? "opacity-70" : ""}`}
          >
            <span
              className={`absolute left-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none ${enabled ? "translate-x-5" : "translate-x-0"}`}
            >
              {enabled && (
                <svg viewBox="0 0 12 12" className="h-3 w-3 text-ka" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.5 6.5l2.5 2.5 4.5-5.5" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>

      {details && (
        <details className="mt-2 text-xs text-gray-600 group">
          <summary className="cursor-pointer select-none text-link underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link w-fit">
            {details.summary}
          </summary>
          <div className="mt-2 space-y-1 leading-relaxed">{details.body}</div>
        </details>
      )}

      {/* Her zaman DOM'da (boşken yüksekliği yok): ekran okuyucu ilk mesajı kaçırmasın */}
      <p
        id={`${id}-s`}
        role={status === "error" ? "alert" : "status"}
        aria-live={status === "error" ? "assertive" : "polite"}
        className={`text-xs ${message ? "mt-2" : ""} ${status === "error" ? "text-red-700" : "text-gray-600"}`}
      >
        {message}
      </p>
      {footnote && <div className="text-xs text-gray-500">{footnote}</div>}
    </div>
  );
}
