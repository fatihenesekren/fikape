"use client";

import { useState } from "react";

const DEFAULT_SLUG = "citroen-c5-aircross-1-6-puretech-shine-2020";

interface ApiResult {
  status: number;
  remaining: number | null;
  retryAfter: number | null;
  body: unknown;
}

export function TryItWidget() {
  const [slug, setSlug] = useState(DEFAULT_SLUG);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  async function run() {
    const cleanSlug = slug.trim();
    if (!cleanSlug || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/public/skor/${encodeURIComponent(cleanSlug)}`);
      const body = await res.json().catch(() => null);
      const remainingHeader = res.headers.get("X-RateLimit-Remaining");
      const retryAfterHeader = res.headers.get("Retry-After");
      setResult({
        status: res.status,
        remaining: remainingHeader !== null ? Number(remainingHeader) : null,
        retryAfter: retryAfterHeader !== null ? Number(retryAfterHeader) : null,
        body,
      });
    } catch {
      setResult({ status: 0, remaining: null, retryAfter: null, body: { error: "Bağlantı hatası, tekrar dene." } });
    } finally {
      setLoading(false);
    }
  }

  const ok = result !== null && result.status >= 200 && result.status < 300;

  return (
    <div className="border border-gray-100 bg-white rounded-2xl p-5 min-w-0">
      <p className="text-sm text-gray-600 mb-3">
        Bir araç slug&apos;ı gir, gerçek API&apos;yi tarayıcından çağıralım — kayıt/anahtar gerekmez.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="arac-slug"
          className="flex-1 min-w-0 text-sm rounded-lg border border-gray-200 px-3 py-2 font-mono"
        />
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white shrink-0 disabled:opacity-60 bg-gray-900 hover:bg-gray-800 transition-colors"
        >
          {loading ? "Çağrılıyor…" : "Dene"}
        </button>
      </div>

      {result && (
        <div className="mt-3 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5 text-xs">
            <span className={ok ? "font-semibold text-green-700" : "font-semibold text-red-600"}>
              HTTP {result.status || "—"}
            </span>
            {result.remaining !== null && (
              <span className="text-gray-400">kalan istek: {result.remaining}/30</span>
            )}
            {result.retryAfter !== null && (
              <span className="text-gray-400">{result.retryAfter} saniye sonra tekrar dene</span>
            )}
          </div>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs">
            {JSON.stringify(result.body, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
