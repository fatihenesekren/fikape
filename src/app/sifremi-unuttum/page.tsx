"use client";

import { useState } from "react";
import Link from "next/link";

export default function SifremiUnuttumPage() {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Bir hata oluştu.");
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-0.5 text-2xl font-black tracking-tight select-none mb-4">
            <span style={{ color: "#185FA5" }}>fi</span>
            <span className="text-gray-300 font-light">·</span>
            <span style={{ color: "#3B6D11" }}>ka</span>
            <span className="text-gray-300 font-light">·</span>
            <span style={{ color: "#993C1D" }}>pe</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Şifreni mi unuttun?</h1>
          <p className="text-sm text-gray-500 mt-1">E-posta adresini gir, sana şifre sıfırlama linki gönderelim</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-2">
            <p className="text-sm text-gray-700 font-medium">E-postanı kontrol et</p>
            <p className="text-sm text-gray-500">
              <strong>{email}</strong> adresine bir şifre sıfırlama linki gönderdik. Link 24 saat geçerlidir.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 tracking-wide">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  e.target.setCustomValidity("");
                }}
                onInvalid={(e) => e.currentTarget.setCustomValidity(
                  e.currentTarget.validity.valueMissing
                    ? "E-posta zorunludur."
                    : "Geçerli bir e-posta adresi giriniz (ör. ornek@example.com)."
                )}
                required
                placeholder="ornek@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={{ background: "#185FA5" }}
            >
              {loading ? "Gönderiliyor..." : "Sıfırlama linki gönder"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          Şifreni hatırladın mı?{" "}
          <Link href="/giris" className="font-semibold text-gray-900 hover:underline">
            Giriş yap
          </Link>
        </p>

      </div>
    </div>
  );
}
