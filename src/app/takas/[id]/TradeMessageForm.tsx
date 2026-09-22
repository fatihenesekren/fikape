"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { VoiceInputButton } from "@/components/review/FormPrimitives";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { applyTextWithLimit } from "@/lib/reviewValidation";

interface OwnListing {
  id: number;
  vehicleName: string;
}

export function TradeMessageForm({
  listingId,
  myActiveListings,
}: {
  listingId: number;
  myActiveListings: OwnListing[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  // Birden fazla aktif ilanı varsa en son açılanı varsayılan seçili gelir,
  // değiştirilebilir — tek ilanı varsa zaten tek seçenek, otomatik o gönderilir
  // (bkz. kullanıcı geri bildirimi: alıcı hangi araçla teklif edildiğini
  // bilmiyordu).
  const [initiatorListingId, setInitiatorListingId] = useState<string>(
    myActiveListings[0]?.id.toString() ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function submit() {
    setError(null);
    if (text.trim().length < 1) {
      setError("Mesaj boş olamaz.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/trades/${listingId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, initiatorListingId: initiatorListingId || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        // 409 + threadId: bu çiftle zaten bir görüşme var (aynı ya da başka
        // ilandan) — hata göstermek yerine o görüşmeye yönlendir.
        if (res.status === 409 && data.threadId) {
          router.push(`/mesajlar/${data.threadId}`);
          return;
        }
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      router.push(`/mesajlar/${data.threadId}`);
    } catch {
      setError("Bir hata oluştu, tekrar deneyiniz.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {myActiveListings.length > 1 && (
        <div>
          <label htmlFor="initiator-listing" className="block text-xs font-semibold text-gray-500 mb-1">
            Hangi aracınızla teklif ediyorsunuz?
          </label>
          <select
            id="initiator-listing"
            value={initiatorListingId}
            onChange={(e) => setInitiatorListingId(e.target.value)}
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2"
          >
            {myActiveListings.map((l) => (
              <option key={l.id} value={l.id}>{l.vehicleName}</option>
            ))}
          </select>
        </div>
      )}
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white focus-within:border-gray-400 transition-colors">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 1000))}
          placeholder="İlgilendiğinizi belirtmek için bir mesaj yazınız..."
          rows={3}
          maxLength={1000}
          className="w-full text-sm px-3 py-2 border-0 block focus:outline-none"
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
          <span className="text-xs text-gray-400">Sesli giriş — konuşarak metni oluşturabilirsiniz</span>
        </div>
      </div>
      <button
        onClick={submit}
        disabled={submitting}
        className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
        style={{ background: "#0C447C" }}
      >
        {submitting ? "Gönderiliyor..." : "Mesaj Gönder"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
