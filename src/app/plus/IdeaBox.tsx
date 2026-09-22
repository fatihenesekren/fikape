"use client";

import { useState } from "react";

const NOTE_LIMIT = 240;

export function IdeaBox({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!email.includes("@")) {
      setError("Geçerli bir e-posta adresi giriniz.");
      return;
    }
    if (!note.trim()) {
      setError("Fikrini kısaca yazar mısın?");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist/plus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      setDone(true);
      setAlreadyJoined(Boolean(data.alreadyJoined));
    } catch {
      setError("Bir hata oluştu, tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-sm font-medium text-green-700 bg-green-50 rounded-xl px-4 py-3">
        {alreadyJoined
          ? "✓ Fikrini aldık — zaten listedesin, gelişmelerden haberin olacak."
          : "✓ Teşekkürler! Fikrini not ettik, gelişmelerden haberin olacak."}
      </div>
    );
  }

  return (
    <div className="border border-gray-100 bg-white rounded-2xl p-5">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, NOTE_LIMIT))}
        placeholder="Sende olmayan ne eksik? Kısaca yaz…"
        rows={3}
        maxLength={NOTE_LIMIT}
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 resize-none"
      />
      <div className="mt-1 text-right text-xs text-gray-400">
        {note.length}/{NOTE_LIMIT}
      </div>

      <p className="mt-2 text-xs text-gray-400">
        Fikrini gönderdiğinde sana bu adresten dönüş yaparız.
      </p>
      <div className="mt-1 flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e-posta@ornek.com"
          className="flex-1 min-w-0 text-sm rounded-lg border border-gray-200 px-3 py-2"
        />
        <button
          onClick={submit}
          disabled={submitting}
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white shrink-0 disabled:opacity-60 bg-gray-900 hover:bg-gray-800 transition-colors"
        >
          {submitting ? "Gönderiliyor…" : "Gönder"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
