"use client";

import { useState } from "react";

interface Props {
  email: string;
}

export function VerificationBanner({ email }: Props) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    await fetch("/api/auth/resend-verification", { method: "POST" });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-amber-700">
          ⚠ <strong>{email}</strong> adresinizi henüz doğrulamadınız.
        </span>
        {sent ? (
          <span className="text-amber-600 font-semibold">Gönderildi — gelen kutunuzu kontrol edin.</span>
        ) : (
          <button
            onClick={resend}
            disabled={loading}
            className="font-semibold text-amber-800 underline hover:no-underline disabled:opacity-60"
          >
            {loading ? "Gönderiliyor..." : "Doğrulama e-postası gönder"}
          </button>
        )}
      </div>
    </div>
  );
}
