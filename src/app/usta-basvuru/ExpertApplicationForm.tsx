"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TURKISH_CITIES } from "@/lib/turkishCities";
import { TURKISH_DISTRICTS } from "@/lib/turkishDistricts";
import { StyledCheckbox } from "@/components/StyledCheckbox";
import { PhotoUploader } from "@/components/review/PhotoUploader";

export function ExpertApplicationForm() {
  const router = useRouter();

  const [headline, setHeadline] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [bio, setBio] = useState("");
  const [notCommercial, setNotCommercial] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // Çalışma yeri fotoğrafları — kullanıcı isteğiyle başvuru formuna da
  // eklendi (önceden yalnız onay sonrası Profil Ayarları'ndaydı), tamamen
  // opsiyonel. Aynı rıza + iki slotlu (tabela/iç mekan) yapı.
  const [consentWorkplacePhoto, setConsentWorkplacePhoto] = useState(false);
  const [storefrontUrls, setStorefrontUrls] = useState<string[]>([]);
  const [interiorUrls, setInteriorUrls] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allChecksPass = notCommercial && ageConfirmed && privacyConsent;
  const districtOptions = city ? TURKISH_DISTRICTS[city] ?? [] : [];

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 8) setTags([...tags, t]);
    setTagInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (headline.trim().length < 8) return setError("Başlık en az 8 karakter olmalıdır.");
    if (tags.length === 0) return setError("En az bir uzmanlık alanı ekleyiniz.");
    if (!city) return setError("İl seçiniz.");
    if (bio.trim().length < 30) return setError("Kendinizi en az 30 karakterle tanıtınız.");
    if (!allChecksPass) return setError("Aşağıdaki onayları işaretlemeniz gerekiyor.");

    setLoading(true);
    try {
      const res = await fetch("/api/expert-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline.trim(),
          expertiseTags: tags,
          city,
          district: district.trim() || null,
          bio: bio.trim(),
          notCommercial,
          ageConfirmed,
          privacyConsent,
          consentWorkplacePhoto,
          workplacePhotos: consentWorkplacePhoto
            ? [
                ...storefrontUrls.map((url) => ({ url, kind: "STOREFRONT" as const })),
                ...interiorUrls.map((url) => ({ url, kind: "INTERIOR" as const })),
              ]
            : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        setLoading(false);
        return;
      }
      router.push(`/usta-basvuru?gonderildi=${data.status === "WAITLISTED" ? "waitlisted" : "1"}`);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="w-10 h-1 rounded-full mb-3" style={{ background: "var(--fi-strong)" }} />
        <h1 className="text-2xl font-black text-gray-900">Usta Başvurusu</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bir tamir/bakım ustasıysanız başvurunuzu bırakın; admin onayından sonra
          araç modelleri hakkında teknik görüş paylaşabilirsiniz.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Başlık</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value.slice(0, 120))}
              placeholder="Örn: 18 yıllık dizel motor ustası · Bursa"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

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
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="text-gray-400 hover:text-gray-700">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">İl</label>
              <select
                value={city}
                onChange={(e) => { setCity(e.target.value); setDistrict(""); }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
              >
                <option value="">Seçiniz</option>
                {TURKISH_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                İlçe <span className="text-gray-400 font-normal">(opsiyonel)</span>
              </label>
              <select
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kendinizi tanıtın</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 2000))}
              rows={5}
              placeholder="Deneyiminiz, uzmanlaştığınız marka/modeller, işletmeniz hakkında kısa bilgi..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 resize-y"
            />
          </div>
        </div>

        {/* Çalışma yeri fotoğrafları — tamamen opsiyonel, ContactSettingsForm.tsx
            ile AYNI rıza metni/yükleme deseni (moderasyon şart, geri
            çekilirse derhal silinir). Başvuru anında ExpertProfile satırı
            zaten oluştuğu için (bkz. api/expert-applications/route.ts)
            aynı altyapı burada da çalışıyor. */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">📸 Çalışma Yeri Fotoğrafları (opsiyonel)</p>
          <StyledCheckbox checked={consentWorkplacePhoto} onChange={setConsentWorkplacePhoto}>
            Yükleyeceğim çalışma yeri fotoğraflarının <strong>kendi işletmeme/çalışma alanıma ait</strong>,
            benim çektiğim veya çekilmesine izin verdiğim fotoğraflar olduğunu beyan ederim
            (başkasına ait veya internetten alınmış bir görsel değildir). Bu fotoğrafların,
            başvurum onaylandığında profil sayfamda herkese açık paylaşılmasına açık rıza
            veriyorum. Her fotoğraf yayınlanmadan önce incelenir. Bu rızayı istediğim zaman
            geri çekebilirim; geri çektiğimde tüm fotoğraflarım <strong>derhal</strong> kaldırılır.
          </StyledCheckbox>

          {consentWorkplacePhoto && (
            <div className="space-y-5 pl-[30px]">
              <PhotoUploader
                existingPhotos={[]}
                removedExistingIds={[]}
                onToggleRemoveExisting={() => {}}
                newPhotoUrls={storefrontUrls}
                onNewPhotoUrlsChange={setStorefrontUrls}
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
                existingPhotos={[]}
                removedExistingIds={[]}
                onToggleRemoveExisting={() => {}}
                newPhotoUrls={interiorUrls}
                onNewPhotoUrlsChange={setInteriorUrls}
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

        <div className="space-y-3 bg-white border border-gray-100 rounded-2xl p-4">
          <StyledCheckbox checked={notCommercial} onChange={setNotCommercial}>
            Araç alım-satımı yapan bir galeri/oto pazarlama işletmesinin sahibi, ortağı veya çalışanı değilim;
            bir marka veya yetkili servisin çalışanı/temsilcisi/sözleşmeli hizmet sağlayıcısı değilim.
          </StyledCheckbox>
          <StyledCheckbox checked={ageConfirmed} onChange={setAgeConfirmed}>
            18 yaşından büyüğüm.
          </StyledCheckbox>
          <StyledCheckbox checked={privacyConsent} onChange={setPrivacyConsent} className="text-xs text-gray-500">
            <Link href="/gizlilik" className="underline" target="_blank">Gizlilik Politikası</Link>
            {"'nı ve "}
            <Link href="/kullanim-kosullari" className="underline" target="_blank">Kullanım Koşulları</Link>
            {"'nı okudum, kabul ediyorum."}
          </StyledCheckbox>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Başvurunuz, girdiğiniz bilgilerin içerik uygunluğu açısından incelenir. fikape kimlik
          veya meslek belgesi istemez ya da doğrulamaz — &quot;Usta&quot; rozeti kendi beyanınıza
          dayanır ve yayınladığınız her not moderasyondan geçer.
        </p>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={loading || !allChecksPass}
          className="w-full px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: "var(--btn-dark)" }}
        >
          {loading ? "Gönderiliyor…" : "Başvuruyu gönder"}
        </button>
      </form>
    </div>
  );
}
