"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-3.27 2.87A9.12 9.12 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 3.06-4.34" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

const RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: "En az 8 karakter uzunluğunda olmalıdır.", test: (pw) => pw.length >= 8 },
  { label: "En az 1 büyük harf içermelidir.", test: (pw) => /[A-ZÇĞİÖŞÜ]/.test(pw) },
  { label: "En az 1 küçük harf içermelidir.", test: (pw) => /[a-zçğıöşü]/.test(pw) },
  { label: "En az 1 rakam içermelidir.", test: (pw) => /[0-9]/.test(pw) },
  { label: "En az 1 özel karakter içermelidir.", test: (pw) => /[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\;'`~]/.test(pw) },
  { label: "Boşluk karakteri içeremez.", test: (pw) => pw.length > 0 && /^\S*$/.test(pw) },
];

function passwordStrength(pw: string): { label: string; color: string; ratio: number } {
  const passed = RULES.filter((r) => r.test(pw)).length;
  if (pw.length === 0) return { label: "", color: "transparent", ratio: 0 };
  if (passed <= 2) return { label: "Zayıf", color: "#dc2626", ratio: passed / RULES.length };
  if (passed <= 4) return { label: "Orta", color: "#d97706", ratio: passed / RULES.length };
  return { label: "Güçlü", color: "#16a34a", ratio: passed / RULES.length };
}

function SifreSifirlaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword]               = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [done, setDone]                       = useState(false);

  const strength = passwordStrength(password);
  const allRulesPass = RULES.every((r) => r.test(password));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Bir hata oluştu.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/giris"), 2000);
  }

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm text-gray-700 font-medium mb-2">Geçersiz bağlantı</p>
          <p className="text-sm text-gray-500 mb-4">Bu şifre sıfırlama linki eksik veya bozuk.</p>
          <Link href="/sifremi-unuttum" className="font-semibold text-gray-900 hover:underline text-sm">
            Yeniden şifre sıfırlama linki iste
          </Link>
        </div>
      </div>
    );
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
          <h1 className="text-xl font-bold text-gray-900">Yeni şifre belirle</h1>
          <p className="text-sm text-gray-500 mt-1">Hesabın için yeni bir şifre oluştur</p>
        </div>

        {done ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-2">
            <p className="text-sm text-gray-700 font-medium">Şifren güncellendi</p>
            <p className="text-sm text-gray-500">Girişe yönlendiriliyorsun...</p>
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
                Yeni şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    e.target.setCustomValidity("");
                  }}
                  onInvalid={(e) => e.currentTarget.setCustomValidity("Şifre zorunludur, yukarıdaki kuralları sağlamalıdır.")}
                  required
                  placeholder="En az 8 karakter"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="pt-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${strength.ratio * 100}%`, background: strength.color }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                  <ul className="space-y-1">
                    {RULES.map((rule) => {
                      const pass = rule.test(password);
                      return (
                        <li key={rule.label} className={`text-xs flex items-center gap-1.5 ${pass ? "text-green-600" : "text-gray-400"}`}>
                          <span>{pass ? "✓" : "○"}</span>
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 tracking-wide">
                Yeni şifre (tekrar)
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  e.target.setCustomValidity("");
                }}
                onInvalid={(e) => e.currentTarget.setCustomValidity("Şifre tekrarı zorunludur.")}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !allRulesPass}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={{ background: "#185FA5" }}
            >
              {loading ? "Kaydediliyor..." : "Şifremi güncelle"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default function SifreSifirlaPage() {
  return (
    <Suspense>
      <SifreSifirlaForm />
    </Suspense>
  );
}
