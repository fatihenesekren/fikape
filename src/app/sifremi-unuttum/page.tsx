"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function SifremiUnuttumPage() {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const sonucRef = useRef<HTMLDivElement>(null);

  // Form kaybolup sonuç kartı gelince odak <body>'ye düşmesin; kart okunur ve klavye kullanıcısı yerini bilir.
  useEffect(() => {
    if (sent) sonucRef.current?.focus();
  }, [sent]);

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

        <div className="text-center mb-5">
          <Link href="/" className="inline-flex items-center gap-0.5 text-2xl font-black tracking-tight select-none mb-4">
            <span className="text-fi">fi</span>
            <span className="text-gray-300 font-light">·</span>
            <span className="text-ka">ka</span>
            <span className="text-gray-300 font-light">·</span>
            <span className="text-pe">pe</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Şifrenizi mi unuttunuz?</h1>
          <p className="text-sm text-gray-600 mt-1">E-posta adresinizi girin, size şifre sıfırlama linki gönderelim</p>
        </div>

        {sent ? (
          <div
            ref={sonucRef}
            tabIndex={-1}
            role="status"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 focus:outline-none"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-link-soft text-link-deep" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                  <path d="M3.5 7.5l8.5 6 8.5-6" />
                </svg>
              </span>
              <h2 className="text-lg font-bold text-gray-900">E-postanızı kontrol edin</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                Bu adres bir hesaba kayıtlıysa şifre sıfırlama linki gönderildi. Link 24 saat geçerlidir.
              </p>
              <p className="max-w-full break-all rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-900">{email}</p>
            </div>

            <div className="rounded-xl border border-link-line bg-link-soft/60 px-4 py-3 text-sm text-gray-700 leading-relaxed">
              <p className="font-semibold text-link-deep">E-posta gelmediyse</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                <li>Birkaç dakika bekleyin ve istenmeyen (spam) klasörüne bakın.</li>
                <li>Adresi doğru yazdığınızdan emin olun.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => { setSent(false); setError(""); }}
              className="w-full min-h-11 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
              Adresi değiştir
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 tracking-wide">
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
              style={{ background: "var(--fi)" }}
            >
              {loading ? "Gönderiliyor..." : "Link gönder"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600 mt-4">
          Şifrenizi hatırladınız mı?{" "}
          <Link href="/giris" className="font-semibold text-gray-900 hover:underline">
            Giriş yap
          </Link>
        </p>

      </div>
    </div>
  );
}
