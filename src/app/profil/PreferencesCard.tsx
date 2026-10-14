"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { PreferenceSwitch } from "@/components/PreferenceSwitch";

type Props = {
  emailEnabled: boolean;
  /** true/false: verilmiş karar; null: hiç sorulmamış (kart açık gelir). */
  sharingGranted: boolean | null;
  /** Son karar tarihi, sunucuda biçimlendirilmiş ("14 Ekim 2026"). */
  sharingChangedLabel: string | null;
};

// "Bildirim ve gizlilik tercihleri" kartı: kapalıyken tek satırlık durum özeti gösterir, başlığa tıklayınca açılır.
// Rıza hiç sorulmamışsa (null) açık gelir ki seçenek fark edilsin; karar verildikten sonra varsayılan kapalıdır.
// İçerik kapalıyken de DOM'da kalır (hidden): anahtar durumları ve özet satırı canlı kalır.
export function PreferencesCard({ emailEnabled, sharingGranted, sharingChangedLabel }: Props) {
  const id = useId();
  const [open, setOpen] = useState(sharingGranted === null);
  const [email, setEmail] = useState(emailEnabled);
  const [sharing, setSharing] = useState<boolean | null>(sharingGranted);

  const summary = [
    { label: "E-posta:", value: email ? "Açık" : "Kapalı" },
    { label: "İş ortağı paylaşımı:", value: sharing === null ? "Henüz seçim yapılmadı" : sharing ? "Açık" : "Kapalı" },
  ];

  return (
    <section aria-labelledby={`${id}-h`} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <h2 id={`${id}-h`} className="m-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={`${id}-body`}
          className="flex w-full min-h-[44px] items-center justify-between gap-3 px-5 py-4 text-left sm:px-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-link"
        >
          <span className="min-w-0">
            <span className="block text-sm font-bold text-gray-900">Bildirim ve gizlilik tercihleri</span>
            <span className="mt-0.5 block text-xs font-normal text-gray-600">
              {open
                ? "Bu tercihleri dilediğiniz zaman değiştirebilirsiniz."
                : summary.map((x, i) => (
                    <span key={x.label}>
                      {i > 0 && " · "}
                      <span className="font-semibold text-gray-800">{x.label}</span> {x.value}
                    </span>
                  ))}
            </span>
          </span>
          <svg
            viewBox="0 0 20 20"
            className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 8l5 5 5-5" />
          </svg>
        </button>
      </h2>

      <div id={`${id}-body`} hidden={!open} className="divide-y divide-gray-100 border-t border-gray-100">
        <PreferenceSwitch
          title="E-posta bildirimleri"
          description="Yorumlarınıza gelen yanıtlar ve hesabınızla ilgili önemli gelişmeler için e-posta alırsınız."
          endpoint="/api/profile/notifications"
          initialEnabled={emailEnabled}
          onChange={setEmail}
        />
        <PreferenceSwitch
          title="Yorumlarım iş ortaklarının sitelerinde adsız gösterilebilsin"
          description={
            <>
              İsteğe bağlıdır; vermemeniz hizmeti kullanmanızı etkilemez. Ayrıntılar için{" "}
              <Link href="/gizlilik" className="text-link underline underline-offset-2">Gizlilik Politikası</Link>.
            </>
          }
          details={{
            summary: "Neler paylaşılır?",
            body: (
              <>
                <p><strong className="text-gray-900">Paylaşılır:</strong> yorum metniniz ve puanlarınız.</p>
                <p><strong className="text-gray-900">Paylaşılmaz:</strong> adınız, e-posta adresiniz ve fotoğraflarınız.</p>
                <p>Şu an iş ortaklarıyla paylaşım yapılmıyor; başlamadan önce sizi bilgilendireceğiz ve gerekirse yeniden izninizi isteyeceğiz.</p>
                <p>
                  İzni dilediğiniz zaman geri çekebilirsiniz; bundan sonra yorumlarınız paylaşılmaz. Daha önce
                  paylaşılmış içeriklerin kaldırılması için{" "}
                  <a href="mailto:info@fikape.com" className="text-link underline underline-offset-2">info@fikape.com</a>{" "}
                  adresine yazabilirsiniz.
                </p>
              </>
            ),
          }}
          endpoint="/api/profile/review-sharing"
          initialEnabled={sharingGranted === true}
          onText="Adsız paylaşılabilir"
          offText={sharing === null ? "Henüz seçilmedi" : "Paylaşılmıyor"}
          footnote={sharingChangedLabel ? `Son değişiklik: ${sharingChangedLabel}` : undefined}
          onChange={setSharing}
        />
      </div>
    </section>
  );
}
