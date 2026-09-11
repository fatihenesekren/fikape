"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TURKISH_CITIES } from "@/lib/turkishCities";

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

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (!notCommercial || !ageConfirmed) return setError("Aşağıdaki beyanları onaylamanız gerekiyor.");

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
        <h1 className="text-2xl font-black text-gray-900">Usta Başvurusu</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bir tamir/bakım ustasıysanız başvurunuzu bırakın; admin onayından sonra
          araç modelleri hakkında teknik görüş paylaşabilirsiniz.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
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
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">Seçiniz</option>
              {TURKISH_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">İlçe <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value.slice(0, 60))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
            />
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

        <div className="space-y-2 bg-gray-50 rounded-xl p-4">
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={notCommercial} onChange={(e) => setNotCommercial(e.target.checked)} className="mt-0.5" />
            Araç alım-satımı yapan bir galeri/oto pazarlama işletmesinin sahibi, ortağı veya çalışanı değilim;
            bir marka veya yetkili servisin çalışanı/temsilcisi/sözleşmeli hizmet sağlayıcısı değilim.
          </label>
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="mt-0.5" />
            18 yaşından büyüğüm.
          </label>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Başvurunuz, girdiğiniz bilgilerin içerik uygunluğu açısından incelenir. fikape kimlik
          veya meslek belgesi istemez ya da doğrulamaz — &quot;Usta&quot; rozeti kendi beyanınıza
          dayanır ve yayınladığınız her not moderasyondan geçer.
        </p>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "#111" }}
        >
          {loading ? "Gönderiliyor…" : "Başvuruyu gönder"}
        </button>
      </form>
    </div>
  );
}
