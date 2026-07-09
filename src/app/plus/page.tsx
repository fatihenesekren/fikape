import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { WaitlistForm } from "./WaitlistForm";

export const metadata: Metadata = {
  title: "Fikape Plus",
  description: "Fikape Plus — gelişmiş filtre ve kayıtlı arama, yakında geliyor.",
};

export default async function PlusPage() {
  const session = await auth();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Ana sayfaya dön
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Fikape Plus</h1>
      <p className="text-sm text-gray-500 mb-8">
        Kullanıcı taleplerine göre geliştirdiğimiz yeni özellikler — daha rahat karar vermeni
        sağlayacak araçlar, henüz yapım aşamasında.
      </p>

      <ul className="space-y-3 text-sm text-gray-700 mb-8">
        <li className="flex gap-2"><span>🔍</span><span><b>Gelişmiş filtre</b> — birden fazla kritere göre (yıl aralığı, güven seviyesi, kullanım süresi) daraltılmış arama.</span></li>
        <li className="flex gap-2"><span>💾</span><span><b>Kayıtlı arama + bildirim</b> — aradığın kriterlere uyan yeni bir araç/yorum geldiğinde haberin olur.</span></li>
        <li className="flex gap-2"><span>⭐</span><span><b>Favori takip listesi</b> — garajın dışında, ilgilendiğin araçları takip listene ekle.</span></li>
      </ul>

      <p className="text-xs text-gray-400 mb-4">
        Bu arada <Link href="/karsilastir" className="underline hover:text-gray-600">araç karşılaştırma</Link> zaten
        herkese açık.
      </p>

      <WaitlistForm defaultEmail={session?.user?.email ?? ""} />
    </div>
  );
}
