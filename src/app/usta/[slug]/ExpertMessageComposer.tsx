"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VoiceInputButton } from "@/components/review/FormPrimitives";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { applyTextWithLimit } from "@/lib/reviewValidation";

export function ExpertMessageComposer({ expertProfileId }: { expertProfileId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const textRef = useRef(text);
  useEffect(() => { textRef.current = text; }, [text]);
  const speech = useSpeechToText();

  function handleVoiceFinalTranscript(chunk: string) {
    const { text: next, truncated } = applyTextWithLimit(textRef.current, chunk, 1000);
    textRef.current = next;
    setText(next);
    if (truncated) {
      speech.stop();
      setVoiceMessage("Karakter sınırına ulaşıldığı için kayıt durduruldu, kalan kısmı elle düzenleyebilirsiniz.");
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/expert-profiles/${expertProfileId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        setLoading(false);
        return;
      }
      setSent(true);
      setText("");
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-green-700 bg-green-50 rounded-xl p-4">
        Mesajınız gönderildi.{" "}
        <Link href="/mesajlar?tab=usta" className="underline">Mesajlarım&apos;dan takip edebilirsiniz.</Link>
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: "var(--btn-dark)" }}
      >
        💬 Site üzerinden mesaj gönder
      </button>
    );
  }

  return (
    <form onSubmit={send} className="space-y-2">
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white focus-within:border-gray-400 transition-colors">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 1000))}
          rows={3}
          placeholder="Mesajınızı yazın — telefon/e-posta paylaşmanıza gerek yok."
          className="w-full text-sm px-3 py-2.5 border-0 block resize-y focus:outline-none"
        />
        {speech.interimTranscript && (
          <p className="text-xs text-gray-400 italic px-3 pb-1.5 -mt-1">{speech.interimTranscript}</p>
        )}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-t border-gray-100">
          <VoiceInputButton
            status={speech.status}
            message={speech.status === "error" ? speech.errorMessage : voiceMessage}
            onStart={() => { setVoiceMessage(null); speech.start(handleVoiceFinalTranscript); }}
            onStop={() => speech.stop()}
          />
          <span className="text-xs text-gray-400">Sesli giriş</span>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "var(--btn-dark)" }}
      >
        {loading ? "Gönderiliyor…" : "Gönder"}
      </button>
    </form>
  );
}
