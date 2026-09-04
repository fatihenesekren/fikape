"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="İlgilendiğinizi belirtmek için bir mesaj yazınız..."
        rows={3}
        maxLength={1000}
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2"
      />
      <button
        onClick={submit}
        disabled={submitting}
        className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
        style={{ background: "#4338ca" }}
      >
        {submitting ? "Gönderiliyor..." : "Mesaj Gönder"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
