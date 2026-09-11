"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// GEÇİCİ — herkese açık usta başvuru formu (Aşama 5) gelene kadar admin'in
// bir kullanıcıyı e-postasıyla bulup doğrudan ACTIVE usta yapmasını sağlar.
export function BootstrapExpertForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/expert-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Bir hata oluştu." });
      } else {
        setMessage({ type: "ok", text: `Usta yapıldı — /usta/${data.slug}` });
        setEmail("");
        router.refresh();
      }
    } catch {
      setMessage({ type: "error", text: "Bağlantı hatası." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 flex-wrap">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="kullanici@ornek.com"
        className="text-sm border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[220px]"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "#111" }}
      >
        {loading ? "İşleniyor…" : "Usta yap"}
      </button>
      {message && (
        <span className={`text-xs w-full ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </span>
      )}
    </form>
  );
}
