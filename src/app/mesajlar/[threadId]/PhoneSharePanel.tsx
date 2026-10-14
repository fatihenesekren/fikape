"use client";

import { useEffect, useRef, useState } from "react";
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  // Form açılınca numara alanına odak; Vazgeç/Esc ile kapanınca odak "Telefon numaramı paylaş" düğmesine döner.
  useEffect(() => {
    if (open) {
      // Panel ekranın üstüne hizalanır: form (üç madde, alan, onay, düğmeler) kaydırma gerektirmeden görünür.
      sectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      phoneRef.current?.focus({ preventScroll: true });
    } else if (returnFocus.current) {
      returnFocus.current = false;
      openBtnRef.current?.focus();
    }
  }, [open]);

  function kapat() {
    returnFocus.current = true;
    setOpen(false);
    setDetailsOpen(false);
    setError("");
  }

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

  // Form açıkken panelin kendi içinde kaydırma yok; açılınca panel ekranın üstüne hizalanır (scroll-mt: sabit üst çubuk payı).
  return (
    <section ref={sectionRef} aria-label="Telefon paylaşımı" data-phone-form-open={open && !mine} className="shrink-0 scroll-mt-16 px-4 py-3 border-b border-gray-100">
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
                Bu numara size yalnızca bu takas için paylaşıldı; başka amaçla kullanmayınız, başkalarıyla paylaşmayınız.
                Görüşme kapatıldığında numaralar ekrandan kaldırılır; rehberinize kaydettiyseniz o kopya sizde kalır.
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
              ref={openBtnRef}
              type="button"
              onClick={() => setOpen(true)}
              className="min-h-[44px] rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-800 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
              Telefon numaramı paylaş
            </button>
          )}

          {!mine && open && (
            <form
              onSubmit={share}
              onKeyDown={(e) => { if (e.key === "Escape" && !busy) { e.stopPropagation(); kapat(); } }}
              className="space-y-2.5"
            >
              <p className="text-sm font-semibold text-gray-900">Numaranızı paylaşmadan önce</p>
              <ul className="space-y-1.5 text-[13px] leading-snug text-gray-700">
                <li><strong className="font-semibold text-gray-900">Kimlere gösterilir:</strong> Numaranız yalnızca bu görüşmedeki kişiye, o da kendi numarasını paylaşırsa gösterilir.</li>
                <li><strong className="font-semibold text-gray-900">Saklama:</strong> Şifreli saklanır; görüşme kapanınca ya da ilan kapandıktan 30 gün sonra silinir.</li>
                <li><strong className="font-semibold text-gray-900">Geri çekme:</strong> Karşı taraf paylaşana kadar geri çekebilirsiniz. Sonrasında yalnızca görüşmeyi kapatarak numaraları gizleyebilirsiniz.</li>
              </ul>
              <p className="text-xs leading-snug text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
                Tanımadığınız biriyle ilk paylaşmak zorunda değilsiniz; karşı taraf numaranızı kaydedebilir veya ekran görüntüsü alabilir, numaralar doğrulanmaz.
              </p>

              <div>
                <button
                  type="button"
                  onClick={() => setDetailsOpen((v) => !v)}
                  aria-expanded={detailsOpen}
                  aria-controls={`phone-details-${threadId}`}
                  className="inline-flex min-h-[44px] items-center gap-1 text-[13px] text-link underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                >
                  Ayrıntılar ve Gizlilik Politikası
                  <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform motion-reduce:transition-none ${detailsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 8l5 5 5-5" />
                  </svg>
                </button>
                <div id={`phone-details-${threadId}`} hidden={!detailsOpen} className="mt-1 space-y-1.5 text-xs leading-relaxed text-gray-600">
                  <p>Numaranız profilinize kaydedilmez. Girdiğiniz numara doğrulanmaz; karşı tarafın numarası da kendisine ait olmayabilir.</p>
                  <p>Araç görmeden ön ödeme veya IBAN isteyenlere karşı dikkatli olunuz. Telefon görüşmeleri fikape tarafından izlenmez; sorun yaşarsanız yazışmayı mesajlaşma üzerinden sürdürmeniz önerilir.</p>
                  <p>
                    Ayrıntılı bilgi için{" "}
                    <Link href="/gizlilik" target="_blank" rel="noopener" className="text-link underline underline-offset-2">Gizlilik Politikası</Link>
                    &apos;nı (yeni sekmede açılır) okuyabilirsiniz.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700" htmlFor={`phone-${threadId}`}>
                  Cep telefonu numaranız
                </label>
                <input
                  ref={phoneRef}
                  id={`phone-${threadId}`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0532 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-gray-300 px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-link"
                />
              </div>

              <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-gray-800">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0"
                />
                <span>Numaramın, yukarıdaki koşullarla yalnızca bu görüşmedeki kişiye ve karşılıklı paylaşımda gösterilmesini onaylıyorum.</span>
              </label>

              <p role="alert" className="text-xs text-red-700">{error}</p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={busy || !consent || !phone.trim()}
                  aria-describedby={`phone-hint-${threadId}`}
                  className="min-h-[44px] rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                >
                  {busy ? "Paylaşılıyor…" : "Paylaş"}
                </button>
                <button
                  type="button"
                  onClick={kapat}
                  disabled={busy}
                  className="min-h-[44px] rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                >
                  Vazgeç
                </button>
                <span id={`phone-hint-${threadId}`} className="text-[11px] text-gray-500">
                  {!consent || !phone.trim() ? "Paylaşmak için numaranızı girip onay kutusunu işaretleyiniz." : ""}
                </span>
              </div>
            </form>
          )}

          <p role="alert" aria-live="assertive" hidden={open && !mine} className="text-xs text-red-700">{error}</p>
        </div>
      </div>
    </section>
  );
}
