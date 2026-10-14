"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  threadId: number;
  counterpartName: string;
  /** Kendi paylaşımım varsa maskeli gösterim. */
  mine: string | null;
  counterpartShared: boolean;
  /** Yalnızca iki taraf da paylaştıysa sunucuda çözülmüş numara. */
  counterpartPhone: string | null;
};

// Takas görüşmesinde karşılıklı telefon paylaşımı. Numara karşı taraf da paylaşana kadar kimseye görünmez.
// Yerel alert/confirm yok; durum ve hata satır içinde (role="status"/"alert"), geri çekme tek tıkla.
export function PhoneSharePanel({ threadId, counterpartName, mine, counterpartShared, counterpartPhone }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const mutual = mine != null && counterpartPhone != null;
  const endpoint = `/api/trades/threads/${threadId}/phone-share`;

  async function share(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Numaranız paylaşılamadı. Lütfen tekrar deneyiniz.");
      } else {
        setOpen(false);
        setPhone("");
        setConsent(false);
        router.refresh();
      }
    } catch {
      setError("Numaranız paylaşılamadı. Lütfen bağlantınızı kontrol edip tekrar deneyiniz.");
    }
    setBusy(false);
  }

  async function withdraw() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "Paylaşım geri çekilemedi. Lütfen tekrar deneyiniz.");
      else router.refresh();
    } catch {
      setError("Paylaşım geri çekilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyiniz.");
    }
    setBusy(false);
  }

  async function copy() {
    if (!counterpartPhone) return;
    try {
      await navigator.clipboard.writeText(counterpartPhone.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* pano erişimi yoksa numara zaten ekranda */
    }
  }

  return (
    <section aria-label="Telefon paylaşımı" className="shrink-0 max-h-[55vh] overflow-y-auto px-4 py-3 border-b border-gray-100">
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className="text-base leading-6">📞</span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[11px] font-bold text-gray-500">Telefon paylaşımı</p>

          {/* İki taraf da paylaştı: karşı tarafın numarası */}
          {mutual && (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-600">{counterpartName} numarasını paylaştı:</p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`tel:${counterpartPhone!.replace(/\s/g, "")}`}
                  className="inline-flex min-h-[44px] items-center rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                >
                  {counterpartPhone}
                </a>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                >
                  {copied ? "Kopyalandı ✓" : "Kopyala"}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-500">
                Bu numara size yalnızca bu takas için paylaşıldı; başka amaçla kullanmayınız veya üçüncü kişilerle paylaşmayınız.
                Numaralar görüşme kapatıldığında gizlenir. Numarayı kendi rehberinize kaydetmiş olabileceğinizi unutmayınız.
              </p>
              <p className="text-[11px] text-gray-500">Numaranız: {mine}</p>
            </div>
          )}

          {/* Ben paylaştım, karşı taraf henüz değil */}
          {!mutual && mine && (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-600" role="status">
                Numaranızı paylaştınız ({mine}). {counterpartName} da paylaşana kadar numaranız görünmez.
              </p>
              <button
                type="button"
                onClick={withdraw}
                disabled={busy}
                className="min-h-[44px] rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              >
                {busy ? "Geri çekiliyor…" : "Paylaşımı geri çek"}
              </button>
            </div>
          )}

          {/* Karşı taraf paylaştı, ben henüz değil: numara GİZLİ */}
          {!mine && counterpartShared && !open && (
            <p className="text-xs text-gray-600" role="status">
              {counterpartName} telefon numarasını paylaştı. Numarayı görmek için siz de paylaşmanız gerekir.
            </p>
          )}

          {!mine && !counterpartShared && !open && (
            <p className="text-xs text-gray-600">
              Dilerseniz telefon numaranızı bu görüşmeye özel paylaşabilirsiniz. İki taraf da paylaşırsa numaralar görünür.
            </p>
          )}

          {!mine && !open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="min-h-[44px] rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-800 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
              Telefon numaramı paylaş
            </button>
          )}

          {!mine && open && (
            <form onSubmit={share} className="space-y-2">
              <p className="text-[11px] leading-relaxed text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Tanımadığınız biriyle ilk siz paylaşmak zorunda değilsiniz. Araç görmeden ön ödeme veya IBAN isteyenlere karşı dikkatli olunuz.
                Numara doğrulanmadığı için karşı tarafın numarasının gerçekten ona ait olduğundan emin olamayabilirsiniz.
              </p>
              <label className="block text-xs font-medium text-gray-700" htmlFor={`phone-${threadId}`}>
                Cep telefonu numaranız
              </label>
              <input
                id={`phone-${threadId}`}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0532 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-link"
              />
              <p className="text-[11px] leading-relaxed text-gray-600">
                Numaranız yalnızca bu görüşmedeki karşı tarafla, o da kendi numarasını paylaşırsa görüşme boyunca paylaşılır.
                Hesabınıza kaydedilmez, şifreli saklanır; görüşme kapatılınca veya ilan kapandıktan 30 gün sonra silinir.
                Karşı taraf kendi paylaşımını yapmadan numaranız görünmez ve bu aşamada geri çekebilirsiniz.{" "}
                <Link href="/gizlilik" className="text-link underline underline-offset-2">Gizlilik Politikası</Link>
              </p>
              <label className="flex items-start gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <span>Numaramı bu görüşmeyle sınırlı olarak paylaşmayı onaylıyorum.</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={busy || !consent || !phone.trim()}
                  className="min-h-[44px] rounded-lg bg-gray-900 px-4 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                >
                  {busy ? "Paylaşılıyor…" : "Paylaş"}
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setError(""); }}
                  className="min-h-[44px] rounded-lg px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                >
                  Vazgeç
                </button>
              </div>
            </form>
          )}

          <p role="alert" aria-live="assertive" className="min-h-[1rem] text-xs text-red-700">{error}</p>
        </div>
      </div>
    </section>
  );
}
