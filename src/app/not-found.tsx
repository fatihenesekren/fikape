import Link from "next/link";

export const metadata = { title: "Sayfa Bulunamadı — fikape" };

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-5xl font-black tracking-tight select-none">
        <span style={{ color: "#85B7EB" }}>4</span>
        <span style={{ color: "#97C459" }}>0</span>
        <span style={{ color: "#F0997B" }}>4</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-2">
        Bu sayfa bulunamadı
      </h1>
      <p className="text-sm text-gray-500 mb-8 max-w-xs leading-relaxed">
        Aradığın araç veya sayfa artık burada değil ya da hiç olmadı.
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: "#111" }}
        >
          Ana sayfaya dön
        </Link>
        <Link
          href="/arama"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-gray-400 transition-colors"
        >
          Araç ara
        </Link>
      </div>
    </div>
  );
}
