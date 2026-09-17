"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StyledCheckbox } from "@/components/StyledCheckbox";
import { TURKISH_CITIES } from "@/lib/turkishCities";
import { TURKISH_DISTRICTS } from "@/lib/turkishDistricts";
import { PhotoUploader, type ExistingPhoto } from "@/components/review/PhotoUploader";
import { VoiceInputButton } from "@/components/review/FormPrimitives";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { applyTextWithLimit } from "@/lib/reviewValidation";

// "0532...", "+90 532...", "532..." — ne girilmiş olursa olsun 10 haneli
// yerel numaraya indirger (+90/0 önekini atar).
function toLocalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length > 10) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

// "5321234567" -> "532 123 45 67" (yazarken canlı gruplama).
function formatLocalDigits(digits: string): string {
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)].filter(Boolean);
  return parts.join(" ");
}

export function ContactSettingsForm({
  initialHeadline, initialBio, initialCity, initialDistrict,
  initialBusinessName, initialPhone, initialAddress, initialConsentContactPublic, initialConsentRegionalPromo, initialCvNoindex, initialMessagingEnabled, initialExpertiseTags, profileSlug,
  initialConsentWorkplacePhoto, initialStorefrontPhotos, initialInteriorPhotos,
}: {
  initialHeadline: string;
  initialBio: string;
  initialCity: string;
  initialDistrict: string;
  initialBusinessName: string | null;
  initialPhone: string | null;
  initialAddress: string | null;
  initialConsentContactPublic: boolean;
  initialConsentRegionalPromo: boolean;
  initialCvNoindex: boolean;
  initialMessagingEnabled: boolean;
  initialExpertiseTags: string[];
  profileSlug: string;
  initialConsentWorkplacePhoto: boolean;
  initialStorefrontPhotos: ExistingPhoto[];
  initialInteriorPhotos: ExistingPhoto[];
}) {
  const router = useRouter();
  // Profil bilgileri — önceden yalnız başvuru formunda bir kez girilip
  // sonrasında hiç güncellenemiyordu (bkz. yukarıdaki uzmanlık alanları
  // notu — aynı sorunun başlık/bio/il-ilçe versiyonu, kullanıcı fark etti).
  const [headline, setHeadline] = useState(initialHeadline);
  const [bio, setBio] = useState(initialBio);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const bioRef = useRef(bio);
  useEffect(() => { bioRef.current = bio; }, [bio]);
  const speech = useSpeechToText();

  function handleVoiceFinalTranscript(chunk: string) {
    const { text: next, truncated } = applyTextWithLimit(bioRef.current, chunk, 2000);
    bioRef.current = next;
    setBio(next);
    if (truncated) {
      speech.stop();
      setVoiceMessage("Karakter sınırına ulaşıldığı için kayıt durduruldu, kalan kısmı elle düzenleyebilirsiniz.");
    }
  }
  const [city, setCity] = useState(initialCity);
  const [district, setDistrict] = useState(initialDistrict);
  const districtOptions = city ? TURKISH_DISTRICTS[city] ?? [] : [];
  const [businessName, setBusinessName] = useState(initialBusinessName ?? "");
  // Telefon — kullanıcı "+90 elle yazmadan, girince silinse" dedi: alan
  // yalnız 10 haneli yerel numarayı ("5XX XXX XX XX") tutar, +90 sabit bir
  // önek olarak solda gösterilir; kayıtta ikisi birleştirilir. Var olan bir
  // kayıt "+90"/"0" ile başlıyor olabileceğinden, gösterime almadan önce
  // yerel 10 haneye indirgenir.
  const [phoneDigits, setPhoneDigits] = useState(() => toLocalDigits(initialPhone ?? ""));
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

  // Çalışma yeri fotoğrafları — adresten AYRI bir rıza (d), görsel daha
  // fazla bağlam/üçüncü kişi ifşa edebileceği için (3 ajanlı panel kararı).
  // Rıza kapanırsa sunucu tüm fotoğrafları derhal siler (contact route'ta).
  const [consentWorkplacePhoto, setConsentWorkplacePhoto] = useState(initialConsentWorkplacePhoto);
  const [storefrontRemovedIds, setStorefrontRemovedIds] = useState<number[]>([]);
  const [storefrontNewUrls, setStorefrontNewUrls] = useState<string[]>([]);
  const [interiorRemovedIds, setInteriorRemovedIds] = useState<number[]>([]);
  const [interiorNewUrls, setInteriorNewUrls] = useState<string[]>([]);

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
    if (headline.trim().length < 8) return setError("Başlık en az 8 karakter olmalıdır.");
    if (!city) return setError("İl seçiniz.");
    if (bio.trim().length < 30) return setError("Kendinizi en az 30 karakterle tanıtınız.");
    if (expertiseTags.length === 0) return setError("En az bir uzmanlık alanı ekleyiniz.");
    if (phoneDigits.length > 0 && phoneDigits.length < 10) return setError("Telefon numarası eksik görünüyor.");
    setLoading(true);
    try {
      const res = await fetch("/api/expert-profile/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline.trim(),
          bio: bio.trim(),
          city,
          district: district.trim() || null,
          businessName: businessName.trim() || null,
          contactPhone: phoneDigits ? `+90${phoneDigits}` : null,
          contactAddress: address.trim() || null,
          consentContactPublic,
          consentRegionalPromo,
          consentWorkplacePhoto,
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

      // Çalışma yeri fotoğrafları — ayrı bir uç nokta (moderasyon/pHash farklı
      // bir akış). Rıza kapalıysa yukarıdaki istek zaten hepsini sildi,
      // burada tekrar bir şey göndermeye gerek yok.
      const newPhotos = [
        ...storefrontNewUrls.map((url) => ({ url, kind: "STOREFRONT" as const })),
        ...interiorNewUrls.map((url) => ({ url, kind: "INTERIOR" as const })),
      ];
      const removeIds = [...storefrontRemovedIds, ...interiorRemovedIds];
      if (consentWorkplacePhoto && (newPhotos.length > 0 || removeIds.length > 0)) {
        const photoRes = await fetch("/api/expert-profile/workplace-photos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPhotos, removeIds }),
        });
        const photoData = await photoRes.json().catch(() => ({}));
        if (!photoRes.ok) {
          // Profil bilgileri (üstteki PATCH) zaten kaydedilmiş durumda —
          // kullanıcıya "hiçbir şey kaydedilmedi" izlenimi vermemek için bunu
          // açıkça belirtiyoruz (5 alanlı kod incelemesi bulgusu: kısmi
          // başarı durumu önceden ayırt edilmiyordu).
          setError(`Profil bilgileriniz kaydedildi, ancak fotoğraflar kaydedilemedi: ${photoData.error ?? "bilinmeyen hata"}`);
          setLoading(false);
          router.refresh();
          return;
        }
        setStorefrontNewUrls([]);
        setStorefrontRemovedIds([]);
        setInteriorNewUrls([]);
        setInteriorRemovedIds([]);
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
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
        <div>
          <label htmlFor="usta-headline" className="block text-sm font-semibold text-gray-700 mb-1.5">Başlık</label>
          <input
            id="usta-headline"
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value.slice(0, 120))}
            placeholder="Örn: 18 yıllık dizel motor ustası · Bursa"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="usta-city" className="block text-sm font-semibold text-gray-700 mb-1.5">İl</label>
            <select
              id="usta-city"
              value={city}
              onChange={(e) => { setCity(e.target.value); setDistrict(""); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">Seçiniz</option>
              {TURKISH_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="usta-district" className="block text-sm font-semibold text-gray-700 mb-1.5">
              İlçe <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </label>
            <select
              id="usta-district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={!city}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">{city ? "Belirtmek istemiyorum" : "Önce il seçiniz"}</option>
              {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="usta-bio" className="block text-sm font-semibold text-gray-700 mb-1.5">Kendinizi tanıtın</label>
          <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-gray-400 transition-colors">
            <textarea
              id="usta-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 2000))}
              rows={5}
              placeholder="Deneyiminiz, uzmanlaştığınız marka/modeller, işletmeniz hakkında kısa bilgi..."
              className="w-full px-3 py-2.5 text-sm focus:outline-none resize-y border-0 block"
            />
            {speech.interimTranscript && (
              <p className="text-xs text-gray-400 italic px-3 pb-1.5 -mt-1">{speech.interimTranscript}</p>
            )}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-t border-gray-100">
              <VoiceInputButton
                status={speech.status}
                message={speech.status === "error" ? speech.errorMessage : voiceMessage}
                onStart={() => { setVoiceMessage(null); speech.start(handleVoiceFinalTranscript); }}
                onStop={() => speech.stop()}
              />
              <span className="text-xs text-gray-400">Sesli giriş — konuşarak metni oluşturabilirsiniz</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <label htmlFor="usta-tag-input" className="block text-sm font-semibold text-gray-700 mb-1.5">🔧 Uzmanlık alanları</label>
        <div className="flex gap-2">
          <input
            id="usta-tag-input"
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

      {/* Önceden dört ayrı onay bloğu da düz `bg-gray-50` renginde,
          birbirinden ayrışmayan bir "gri duvar" gibiydi (görsel denetim
          bulgusu) — artık her biri kendi başlığı olan beyaz bir kart. */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">🏢 İletişim Bilgisi Paylaşımı</p>
        <StyledCheckbox checked={consentContactPublic} onChange={setConsentContactPublic}>
          İşyeri adımın, telefon numaramın ve (girersem) açık adresimin{" "}
          <Link href={`/usta/${profileSlug}`} className="underline">profil sayfamda</Link>{" "}
          herkese açık gösterilmesine ve arama motorlarınca indekslenmesine açık rıza veriyorum.
          Bu rızayı istediğim zaman geri çekebilirim; geri çektiğimde bilgilerim{" "}
          <strong>derhal</strong> kaldırılır. Usta statüm, rozetim ve notlarım bundan etkilenmez.
        </StyledCheckbox>

        {consentContactPublic && (
          // Üçü de artık tam genişlik (telefon+adres büyütülünce yan yana
          // sıkıştırmanın anlamı kalmadı) — grid yerine düz dikey istif.
          <div className="space-y-3 pl-[30px]">
            <div>
              <label htmlFor="usta-business-name" className="block text-xs font-semibold text-gray-600 mb-1">İşyeri adı (opsiyonel)</label>
              <input
                id="usta-business-name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value.slice(0, 120))}
                placeholder="Örn. ABC Rot-Balans"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label htmlFor="usta-phone" className="block text-xs font-semibold text-gray-600 mb-1">Telefon (opsiyonel)</label>
              {/* Kullanıcı "+90 elle yazmadan versek, girince silinse" dedi —
                  "+90" artık girilemez sabit bir önek, kullanıcı yalnız 10
                  haneli yerel numarayı yazıyor, yazarken otomatik gruplanıyor. */}
              <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:border-gray-400">
                <span className="flex items-center px-3 text-sm text-gray-500 bg-gray-50 border-r border-gray-200 select-none">+90</span>
                <input
                  id="usta-phone"
                  type="tel"
                  inputMode="numeric"
                  value={formatLocalDigits(phoneDigits)}
                  onChange={(e) => setPhoneDigits(toLocalDigits(e.target.value))}
                  placeholder="5XX XXX XX XX"
                  className="flex-1 min-w-0 px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="usta-address" className="block text-xs font-semibold text-gray-600 mb-1">Açık adres (opsiyonel)</label>
              {/* Önceden tek satırlık input'tu; girilen adres kesiliyordu
                  (kullanıcı fark etti — "biraz büyütsek mi"). Artık tam
                  genişlikte, çok satırlı bir alan. */}
              <textarea
                id="usta-address"
                value={address}
                onChange={(e) => setAddress(e.target.value.slice(0, 300))}
                rows={3}
                placeholder="Sokak, apartman/site adı, kapı no vb."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-y"
              />
            </div>
          </div>
        )}
      </div>

      {/* Çalışma yeri fotoğrafları — kullanıcı isteği: tabela/işletme girişi
          + en fazla 3 iç mekan fotoğrafı, profilin en başında slider olarak
          gösterilecek. Kimlik doğrulama belgesi DEĞİL — businessName/
          contactAddress ile aynı "beyan + açık rıza" kategorisinde, ama
          görsel daha fazla bağlam ifşa edebileceği için KENDİ ayrı rızası
          var (3 ajanlı panel kararı). Doğrudan yayına gitmez — her fotoğraf
          admin onayından geçer (moderasyonsuz kanal asla ilkesi). */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">📸 Çalışma Yeri Fotoğrafları</p>
        <StyledCheckbox checked={consentWorkplacePhoto} onChange={setConsentWorkplacePhoto}>
Yükleyeceğim çalışma yeri fotoğraflarının <strong>kendi işletmeme/çalışma alanıma ait</strong>,
          benim çektiğim veya çekilmesine izin verdiğim fotoğraflar olduğunu beyan ederim
          (başkasına ait veya internetten alınmış bir görsel değildir). Bu fotoğrafların{" "}
          <Link href={`/usta/${profileSlug}`} className="underline">profil sayfamda</Link>{" "}
          herkese açık paylaşılmasına açık rıza veriyorum. Her fotoğraf yayınlanmadan önce
          incelenir; bu bir doğrulama değil, yalnızca içerik uygunluğu kontrolüdür. Bu rızayı
          istediğim zaman geri çekebilirim; geri çektiğimde tüm fotoğraflarım <strong>derhal</strong> kaldırılır.
        </StyledCheckbox>

        {consentWorkplacePhoto && (
          <div className="space-y-5 pl-[30px]">
            <PhotoUploader
              existingPhotos={initialStorefrontPhotos}
              removedExistingIds={storefrontRemovedIds}
              onToggleRemoveExisting={(id) => setStorefrontRemovedIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])}
              newPhotoUrls={storefrontNewUrls}
              onNewPhotoUrlsChange={setStorefrontNewUrls}
              max={1}
              uploadUrl="/api/uploads/expert-workplace-photo"
              pathPrefix="expert-workplace/storefront/"
              title="Tabela / İşletme Girişi"
              intro={
                <span className="block space-y-0.5">
                  <span className="block">• İşletme adı/tabela net ve okunur olmalı, uzaktan bulanık çekmeyin.</span>
                  <span className="block">• Gündüz, doğal ışıkta çekin — gece flaşlı çekimler tabelayı okunmaz hale getirir.</span>
                  <span className="block">• Kadrajda yalnızca işletmenizin girişi/cephesi olsun, komşu dükkanlar mümkünse dışarıda kalsın.</span>
                </span>
              }
            />
            <PhotoUploader
              existingPhotos={initialInteriorPhotos}
              removedExistingIds={interiorRemovedIds}
              onToggleRemoveExisting={(id) => setInteriorRemovedIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])}
              newPhotoUrls={interiorNewUrls}
              onNewPhotoUrlsChange={setInteriorNewUrls}
              max={3}
              uploadUrl="/api/uploads/expert-workplace-photo"
              pathPrefix="expert-workplace/interior/"
              title="İç Mekan"
              intro={
                <span className="block space-y-0.5">
                  <span className="block">• Çalışma alanınızı/ekipmanlarınızı gösteren gerçek fotoğraflar kullanın — stok görsel kullanmayın.</span>
                  <span className="block">• Fotoğraf üzerinde başka bir işletmenin logosu, fiyat listesi veya reklam metni olmasın.</span>
                  <span className="block">• Dağınık/karanlık kareler yerine düzenli ve aydınlık anları tercih edin.</span>
                </span>
              }
            />
            <p className="text-xs text-amber-600 font-medium">
              Plaka, kişilerin yüzü, kimlik/belge gibi kişisel veya hassas bilgi içeren fotoğraf yüklemeyiniz —
              bu tür fotoğraflar admin incelemesinde reddedilir.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">📍 Bölgesel Görünürlük</p>
        <StyledCheckbox checked={consentRegionalPromo} onChange={setConsentRegionalPromo}>
          Beyan ettiğim ilin çevresindeki kullanıcılara, ilgili araç sayfalarında &quot;aktif katkı
          veren ustalar&quot; arasında gösterilmeme açık rıza veriyorum. Bu ücretsizdir, sıralama
          katkı ve kaliteye göre yapılır. (Bölgesel görünürlük yüzeyi henüz devrede değil —
          rızanız kaydedilir, mekanizma yayına girince kullanılır.)
        </StyledCheckbox>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">💬 Mesajlaşma</p>
        <StyledCheckbox checked={messagingEnabled} onChange={setMessagingEnabled}>
          Kullanıcıların site üzerinden bana mesaj göndermesine izin veriyorum. Kapatırsanız
          yeni görüşme başlatılamaz; devam eden görüşmelerde yanıt vermeye devam edebilirsiniz.
          Bu tercih, yukarıdaki iletişim bilgisi paylaşımından bağımsızdır — istediğiniz zaman
          değiştirebilirsiniz.
        </StyledCheckbox>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">🔍 Arama Motoru Görünürlüğü</p>
        <StyledCheckbox checked={cvNoindex} onChange={setCvNoindex}>
          Profil sayfam Google gibi arama motorlarının sonuçlarında çıkmasın.
          <span className="block text-xs text-gray-500 mt-0.5">
            Bunu işaretlerseniz sayfanız yine fikape içinde (usta notlarınızın altında,
            kendi profilinizde) görünmeye devam eder — yalnız Google aramasında çıkmaz.
            İşaretlemezseniz, sayfanız (bilgileriniz herkese açıksa) internette aranabilir hale gelir.
          </span>
        </StyledCheckbox>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        fikape, usta ile kullanıcı arasındaki hizmet ilişkisinin tarafı değildir; işçilik veya
        onarım kalitesini garanti etmez. Detaylı bilgi için{" "}
        <Link href="/usta-ol" className="underline hover:text-gray-600">Usta Görüşleri Nedir?</Link> sayfasına bakınız.
      </p>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">Kaydedildi.</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "var(--btn-dark)" }}
      >
        {loading ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
