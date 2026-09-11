"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ExpertMessageComposer({ expertProfileId }: { expertProfileId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

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
        <Link href="/usta-mesajlarim" className="underline">Mesajlarım&apos;dan takip edebilirsiniz.</Link>
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: "#111" }}
      >
        💬 Site üzerinden mesaj gönder
      </button>
    );
  }

  return (
    <form onSubmit={send} className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 1000))}
        rows={3}
        placeholder="Mesajınızı yazın — telefon/e-posta paylaşmanıza gerek yok."
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 resize-y"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "#111" }}
      >
        {loading ? "Gönderiliyor…" : "Gönder"}
      </button>
    </form>
  );
}
