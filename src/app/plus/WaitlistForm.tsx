"use client";

import { useState } from "react";

export function WaitlistForm({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!email.includes("@")) {
      setError("Geçerli bir e-posta adresi gir.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist/plus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, note: note || undefined }),
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
        {alreadyJoined ? "✓ Zaten listedesin — haber verdiğimizde ilk sen duyacaksın." : "✓ Kaydettik! Bu özellikler hazır olunca ilk sana haber vereceğiz."}
      </div>
    );
  }

  return (
    <div className="border border-gray-100 bg-white rounded-2xl p-5">
      <p className="text-sm text-gray-600 mb-3">
        Bu özellikler henüz yok — ilgileniyorsan e-postanı bırak, hazır olduğunda ilk sana haber verelim.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e-posta@ornek.com"
          className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-2"
        />
        <button
          onClick={submit}
          disabled={submitting}
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white shrink-0 disabled:opacity-60 bg-gray-900 hover:bg-gray-800 transition-colors"
        >
          {submitting ? "Gönderiliyor..." : "İlgileniyorum"}
        </button>
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="En çok neyi kullanırdın? (opsiyonel)"
        maxLength={280}
        className="mt-2 w-full text-sm rounded-lg border border-gray-200 px-3 py-2"
      />
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
