"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function KayitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName, ref }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Bir hata oluştu.");
      setLoading(false);
      return;
    }

    // Kayıt başarılı — otomatik giriş yap
    await signIn("credentials", { email, password, redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-16 bg-gray-50">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-0.5 text-2xl font-black tracking-tight select-none mb-4">
            <span style={{ color: "#185FA5" }}>fi</span>
            <span className="text-gray-300 font-light">·</span>
            <span style={{ color: "#3B6D11" }}>ka</span>
            <span className="text-gray-300 font-light">·</span>
            <span style={{ color: "#993C1D" }}>pe</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Hesap oluştur</h1>
          <p className="text-sm text-gray-500 mt-1">Ücretsiz kayıt ol, deneyimini paylaş</p>
          {ref && (
            <p className="text-xs text-gray-400 mt-2">Bir arkadaşının daveti ile geliyorsun 👋</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Görünen ad
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ahmet K."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
            <p className="text-xs text-gray-400">Yorumlarında görünecek isim. İstersen takma ad kullanabilirsin.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ornek@mail.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="En az 8 karakter"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: "#111" }}
          >
            {loading ? "Kayıt oluşturuluyor..." : "Kayıt ol"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Kayıt olarak{" "}
            <Link href="/gizlilik" className="underline">Gizlilik Politikası</Link>
            {" "}ve{" "}
            <Link href="/kullanim-kosullari" className="underline">Kullanım Koşulları</Link>
            {" "}kabul etmiş sayılırsın.
          </p>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Zaten hesabın var mı?{" "}
          <Link href="/giris" className="font-semibold text-gray-900 hover:underline">
            Giriş yap
          </Link>
        </p>

      </div>
    </div>
  );
}

export default function KayitPage() {
  return (
    <Suspense>
      <KayitForm />
    </Suspense>
  );
}
