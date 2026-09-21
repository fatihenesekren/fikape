"use client";

import { useEffect, useRef, useState } from "react";
import { useSpeechToText } from "@/hooks/useSpeechToText";

// Karşılaştır sayfasındaki (ComparePicker) sesli arama pilotunun, tekil
// controlled state yerine ref üzerinden çalışan genel bir versiyonu — burada
// kullanılan 4 arama kutusu (header, /araclar, /arama, /takas) uncontrolled
// input (defaultValue/ref) ile form submit'e dayanıyor, mimarilerini
// bozmadan mikrofon eklemek için input'un DOM value'sunu doğrudan yönetiyoruz.
//
// Davranış: boşken mikrofon / dinlerken kırmızı pulse-durdur / metin varken
// X-temizle. Konuşma normal şekilde bitince (onend, kullanıcı elle durdurmadı
// veya hataya düşmedi) ve input doluysa formu otomatik submit ediyoruz —
// böylece "konuştum, sonuç geldi" hissi, sayfaların mevcut submit-tabanlı
// mimarisini (SEO/server-render) değiştirmeden korunuyor.
export function VoiceMicButton({
  inputRef,
  formRef,
  rightPx = 6,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  formRef?: React.RefObject<HTMLFormElement | null>;
  // "Ara" butonu da aynı input'un sağında absolute konumlandığı için, mikrofon
  // onun soluna denk gelsin diye her çağıran kendi düzenine göre bu offset'i
  // (piksel) veriyor — bkz. çağıran dosyalardaki "Ara" butonunun genişliği.
  rightPx?: number;
}) {
  const { status, interimTranscript, errorMessage, start, stop, abort, supported } = useSpeechToText();
  const [hasValue, setHasValue] = useState(false);
  const committedRef = useRef("");
  const prevStatusRef = useRef(status);

  // Input'un (uncontrolled) mevcut değerini izler — elle yazma da dahil,
  // mikrofon/temizle ikonunun doğru durumda kalması için.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const sync = () => {
      committedRef.current = el.value;
      setHasValue(!!el.value);
    };
    sync();
    el.addEventListener("input", sync);
    return () => el.removeEventListener("input", sync);
  }, [inputRef]);

  // Dinleme sırasında henüz kesinleşmemiş (interim) kısmı input'a canlı yazar.
  useEffect(() => {
    if (status !== "listening") return;
    const el = inputRef.current;
    if (!el) return;
    const base = committedRef.current;
    el.value = interimTranscript
      ? `${base}${base && !base.endsWith(" ") ? " " : ""}${interimTranscript}`
      : base;
    setHasValue(!!el.value);
  }, [status, interimTranscript, inputRef]);

  // Dinleme normal şekilde bitince (hata/timeout değil) doluysa otomatik ara.
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (prev !== "listening" || status !== "idle") return;
    const el = inputRef.current;
    if (el?.value.trim()) formRef?.current?.requestSubmit();
  }, [status, inputRef, formRef]);

  function handleFinalTranscript(text: string) {
    const el = inputRef.current;
    if (!el) return;
    const base = committedRef.current;
    const next = `${base}${base && !base.endsWith(" ") ? " " : ""}${text}`.trimStart();
    el.value = next;
    committedRef.current = next;
    setHasValue(!!next);
  }

  if (!supported) return null;

  const listening = status === "listening";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (listening) {
            stop();
          } else if (hasValue) {
            const el = inputRef.current;
            if (el) el.value = "";
            committedRef.current = "";
            setHasValue(false);
            abort();
            inputRef.current?.focus();
          } else {
            start(handleFinalTranscript);
          }
        }}
        aria-label={listening ? "Sesli aramayı durdur" : hasValue ? "Aramayı temizle" : "Sesli arama başlat"}
        aria-pressed={listening}
        className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors z-10"
        style={{ right: rightPx, ...(listening ? { color: "#dc2626" } : hasValue ? { color: "#6b7280" } : { color: "#9ca3af" }) }}
      >
        {listening ? (
          <span className="relative flex items-center justify-center" aria-hidden="true">
            <span className="absolute -inset-1.5 rounded-full border-2 border-current opacity-50 animate-pulse motion-reduce:animate-none" />
            <svg width={13} height={13} viewBox="0 0 24 24">
              <rect x={6} y={6} width={12} height={12} rx={2} fill="currentColor" />
            </svg>
          </span>
        ) : hasValue ? (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1={18} y1={6} x2={6} y2={18} />
            <line x1={6} y1={6} x2={18} y2={18} />
          </svg>
        ) : (
          <svg aria-hidden="true" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1={12} y1={19} x2={12} y2={23} />
            <line x1={8} y1={23} x2={16} y2={23} />
          </svg>
        )}
      </button>
      {status === "error" && errorMessage && (
        <p className="absolute left-0 top-full mt-1 text-xs text-amber-700">{errorMessage}</p>
      )}
    </>
  );
}
