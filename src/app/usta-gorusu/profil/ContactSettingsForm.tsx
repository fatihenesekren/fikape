"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ContactSettingsForm({
  initialBusinessName, initialPhone, initialAddress, initialConsentContactPublic, initialConsentRegionalPromo, initialCvNoindex, initialMessagingEnabled, initialExpertiseTags, profileSlug,
}: {
  initialBusinessName: string | null;
  initialPhone: string | null;
  initialAddress: string | null;
  initialConsentContactPublic: boolean;
  initialConsentRegionalPromo: boolean;
  initialCvNoindex: boolean;
  initialMessagingEnabled: boolean;
  initialExpertiseTags: string[];
  profileSlug: string;
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initialBusinessName ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [messagingEnabled, setMessagingEnabled] = useState(initialMessagingEnabled);
  const [consentContactPublic, setConsentContactPublic] = useState(initialConsentContactPublic);
  const [consentRegionalPromo, setConsentRegionalPromo] = useState(initialConsentRegionalPromo);
  const [cvNoindex, setCvNoindex] = useState(initialCvNoindex);
  // Uzmanlık alanları — önceden yalnız başvuru formunda BİR KEZ girilip
  // sonrasında hiç güncellenemiyordu (kullanıcı fark etti). Rızadan bağımsız,
  // her zaman herkese açık profilde görünür — bu yüzden consent bloğunun DIŞINDA.
  const [expertiseTags, setExpertiseTags] = useState<string[]>(initialExpertiseTags);
  const [tagInput, setTagInput] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function addTag() {
    const t = tagInput.trim();
    if (t && !expertiseTags.includes(t) && expertiseTags.length < 8) setExpertiseTags([...expertiseTags, t]);
    setTagInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (expertiseTags.length === 0) return setError("En az bir uzmanlık alanı ekleyiniz.");
    setLoading(true);
    try {
      const res = await fetch("/api/expert-profile/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim() || null,
          contactPhone: phone.trim() || null,
          contactAddress: address.trim() || null,
          consentContactPublic,
          consentRegionalPromo,
          cvNoindex,
          messagingEnabled,
          expertiseTags,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        setLoading(false);
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Uzmanlık alanları</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
            placeholder="Örn: VAG dizel — Enter ile ekle"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
          <button type="button" onClick={addTag} className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200">
            Ekle
          </button>
        </div>
        {expertiseTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {expertiseTags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                {t}
                <button type="button" onClick={() => setExpertiseTags(expertiseTags.filter((x) => x !== t))} className="text-gray-400 hover:text-gray-700">×</button>
              </span>
            ))}
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-1">Profilinizde her zaman herkese açık görünür — en fazla 8 alan.</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={consentContactPublic}
            onChange={(e) => setConsentContactPublic(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            İşyeri adımın, telefon numaramın ve (girersem) açık adresimin{" "}
            <Link href={`/usta/${profileSlug}`} className="underline">profil sayfamda</Link>{" "}
            herkese açık gösterilmesine ve arama motorlarınca indekslenmesine açık rıza veriyorum.
            Bu rızayı istediğim zaman geri çekebilirim; geri çektiğimde bilgilerim{" "}
            <strong>derhal</strong> kaldırılır. Usta statüm, rozetim ve notlarım bundan etkilenmez.
          </span>
        </label>

        {consentContactPublic && (
          <div className="grid sm:grid-cols-2 gap-3 pl-6">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">İşyeri adı (opsiyonel)</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value.slice(0, 120))}
                placeholder="Örn. ABC Rot-Balans"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Telefon (opsiyonel)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Açık adres (opsiyonel)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value.slice(0, 300))}
                placeholder="İş yeri adresiniz"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={consentRegionalPromo}
            onChange={(e) => setConsentRegionalPromo(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Beyan ettiğim ilin çevresindeki kullanıcılara, ilgili araç sayfalarında &quot;aktif katkı
            veren ustalar&quot; arasında gösterilmeme açık rıza veriyorum. Bu ücretsizdir, sıralama
            katkı ve kaliteye göre yapılır. (Bölgesel görünürlük yüzeyi henüz devrede değil —
            rızanız kaydedilir, mekanizma yayına girince kullanılır.)
          </span>
        </label>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={messagingEnabled}
            onChange={(e) => setMessagingEnabled(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Kullanıcıların site üzerinden bana mesaj göndermesine izin veriyorum. Kapatırsanız
            yeni görüşme başlatılamaz; devam eden görüşmelerde yanıt vermeye devam edebilirsiniz.
            Bu tercih, yukarıdaki iletişim bilgisi paylaşımından bağımsızdır — istediğiniz zaman
            değiştirebilirsiniz.
          </span>
        </label>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={cvNoindex} onChange={(e) => setCvNoindex(e.target.checked)} className="mt-0.5" />
          <span>Profil sayfamın arama motorlarında görünmesini istemiyorum (noindex).</span>
        </label>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        fikape, usta ile kullanıcı arasındaki hizmet ilişkisinin tarafı değildir; işçilik veya
        onarım kalitesini garanti etmez. Detaylı bilgi için &quot;Usta Görüşleri Nedir?&quot; sayfasına bakınız.
      </p>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">Kaydedildi.</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "#111" }}
      >
        {loading ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
