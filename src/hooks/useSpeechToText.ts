"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ISpeechRecognition } from "@/types/speech-recognition";

export type SpeechStatus = "idle" | "requesting-permission" | "listening" | "error" | "unsupported";

// Belirli bir süre boyunca hiç sonuç gelmezse (Safari/mobil "var ama bozuk"
// senaryosu) sessizce sonsuza kadar "dinliyor" göstermek yerine hata durumuna
// düşürüyoruz — bkz. docs/sesli-yorum-girisi-plan.md §6.
const NO_RESULT_TIMEOUT_MS = 9000;

function getSpeechRecognitionCtor(): { new (): ISpeechRecognition } | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function mapError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Mikrofon izni verilmedi.";
    case "no-speech":
      return "Ses algılanamadı, tekrar deneyin veya yazarak devam edin.";
    case "network":
      return "Bağlantı sorunu nedeniyle sesli giriş durduruldu.";
    default:
      return "Sesli giriş sırasında bir hata oluştu.";
  }
}

export function useSpeechToText() {
  const supported = typeof window !== "undefined" && !!getSpeechRecognitionCtor();
  const [status, setStatus] = useState<SpeechStatus>(supported ? "idle" : "unsupported");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const noResultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNoResultTimeout = useCallback(() => {
    if (noResultTimeoutRef.current) {
      clearTimeout(noResultTimeoutRef.current);
      noResultTimeoutRef.current = null;
    }
  }, []);

  // Render-safe: yalnızca ref üzerinde senkron abort() çağırır, state güncellemesi
  // yapmaz (o iş recognition'ın kendi async onend/onerror event'lerine bırakılır).
  // Bu sayede ReviewForm'daki "render sırasında state sıfırlama" deseniyle
  // (productSlug değişince) doğrudan çağrılabilir — bkz. plan §6.
  const abort = useCallback(() => {
    clearNoResultTimeout();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }, [clearNoResultTimeout]);

  useEffect(() => () => abort(), [abort]);

  const start = useCallback((onFinalTranscript: (text: string) => void) => {
    if (recognitionRef.current) return; // çift tetikleme guard'ı
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "tr-TR";
    recognition.continuous = true;
    recognition.interimResults = true;

    const resetNoResultTimeout = () => {
      clearNoResultTimeout();
      noResultTimeoutRef.current = setTimeout(() => {
        setStatus("error");
        setErrorMessage("Ses algılanamadı, tekrar deneyin veya yazarak devam edin.");
        recognition.abort();
        recognitionRef.current = null;
      }, NO_RESULT_TIMEOUT_MS);
    };

    recognition.onstart = () => {
      setStatus("listening");
      setErrorMessage(null);
      resetNoResultTimeout();
    };

    recognition.onresult = (event) => {
      resetNoResultTimeout();
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          onFinalTranscript(transcript);
        } else {
          interim += transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      clearNoResultTimeout();
      setStatus("error");
      setErrorMessage(mapError(event.error));
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      clearNoResultTimeout();
      setInterimTranscript("");
      recognitionRef.current = null;
      setStatus((s) => (s === "error" ? s : "idle"));
    };

    recognitionRef.current = recognition;
    setStatus("requesting-permission");
    recognition.start();
  }, [clearNoResultTimeout]);

  const stop = useCallback(() => {
    clearNoResultTimeout();
    recognitionRef.current?.stop();
  }, [clearNoResultTimeout]);

  return { status, interimTranscript, errorMessage, start, stop, abort, supported };
}
