import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { EXPERT_BADGE, CONTACT_VISIBILITY_MIN_PUBLISHED_NOTES } from "@/lib/expertNote";
import { contactFeedbackLabel } from "@/lib/expertContactFeedback";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { ExpertMessageComposer } from "./ExpertMessageComposer";
import { ContactFeedbackWidget } from "./ContactFeedbackWidget";
import { Avatar } from "@/components/Avatar";
import { toTelHref } from "@/lib/phone";
import { WorkplacePhotoSlider } from "./WorkplacePhotoSlider";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await prisma.expertProfile.findUnique({
    where: { slug },
    select: { id: true, headline: true, status: true, cvNoindex: true, visibilityState: true },
  });
  if (!profile || profile.status !== "ACTIVE") return {};
  const forceNoindex = profile.visibilityState === "PAUSED" || profile.visibilityState === "PROBATION";
  // Temel güvenilirlik kapısı — bkz. lib/expertNote.ts CONTACT_VISIBILITY_MIN_PUBLISHED_NOTES notu.
  const publishedNoteCount = await prisma.expertNote.count({
    where: { profileId: profile.id, status: "PUBLISHED", removedAt: null },
  });
  const belowContactThreshold = publishedNoteCount < CONTACT_VISIBILITY_MIN_PUBLISHED_NOTES;
  return {
    title: `${profile.headline ?? "Usta"} — Usta Profili | fikape`,
    description: `${profile.headline ?? "Usta"} — fikape'de usta profili ve teknik katkıları.`,
    robots: profile.cvNoindex || forceNoindex || belowContactThreshold ? { index: false } : undefined,
  };
}

// Usta profil sayfası — İletişim bölümü (b) rızası + en az bir alan girilmişse
// (contactVisible) VE en az CONTACT_VISIBILITY_MIN_PUBLISHED_NOTES yayınlanmış
// notu varsa gösterilir (3 ajanlı panel kararı — 11 Eylül 2026: kimlik/belge
// doğrulaması olmadığı için hiç içerik üretmeden iletişim yayınlamayı önler,
// bkz. lib/expertNote.ts). Site-içi maskeli mesajlaşma (Aşama 6b) ayrıca ve
// HER ZAMAN mevcuttur (bu eşikten VE rızadan bağımsız — §7.2). Sayfa varlığı
// yalnız status=ACTIVE'e bağlı. Barem (Aşama 7) PAUSED/PROBATION üretirse veya
// eşik altındaysa: sayfa 200 kalır ama noindex olur ve iletişim bölümü
// gizlenir — notlar ve rozet her zaman görünür kalır (§14.13).
export default async function ExpertProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [profile, session] = await Promise.all([
    prisma.expertProfile.findUnique({
      where: { slug },
      select: {
        id: true, headline: true, bio: true, expertiseTags: true, city: true, district: true,
        status: true, createdAt: true, contactVisible: true, businessName: true, contactPhone: true, contactAddress: true,
        contactLat: true, contactLng: true,
        visibilityState: true, userId: true, messagingEnabled: true,
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        // Çalışma yeri fotoğrafları — yalnız onaylanmış olanlar herkese
        // açık görünür (moderasyonsuz kanal asla ilkesi). Sıralama JS'de:
        // tabela her zaman ilk kare (bkz. altta), sonra iç mekan.
        workplacePhotos: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "asc" },
          select: { id: true, url: true, kind: true },
        },
      },
    }),
    auth(),
  ]);
  if (!profile || profile.status !== "ACTIVE") notFound();

  const sortedWorkplacePhotos = [
    ...profile.workplacePhotos.filter((p) => p.kind === "STOREFRONT"),
    ...profile.workplacePhotos.filter((p) => p.kind === "INTERIOR"),
  ];
  const promotionPaused = profile.visibilityState === "PAUSED" || profile.visibilityState === "PROBATION";

  // Site-içi maskeli mesajlaşma — telefon/e-posta paylaşmadan iletişim
  // alternatifi (§7.2: (b) rızası olmasa da her zaman mevcut). Kendi
  // profiline veya bloklu kullanıcıya gösterilmez.
  const viewerId = session?.user?.id ? Number(session.user.id) : null;
  const isOwnProfile = viewerId === profile.userId;
  const isBlocked = viewerId && !isOwnProfile
    ? !!(await prisma.blockedUser.findFirst({
        where: {
          OR: [
            { blockerId: viewerId, blockedId: profile.userId },
            { blockerId: profile.userId, blockedId: viewerId },
          ],
        },
        select: { id: true },
      }))
    : false;
  const canMessage = !!viewerId && !isOwnProfile && !isBlocked && profile.messagingEnabled;

  const confirmedContactCount = profile.contactVisible
    ? await prisma.expertContactFeedback.count({ where: { profileId: profile.id, isAccurate: true } })
    : 0;
  const contactFeedbackText = contactFeedbackLabel(confirmedContactCount);

  // "Bu bilgi doğru muydu?" sorusu artık BURADA (iletişim bilgisinin
  // gösterildiği yer) soruluyor — önceden mesaj thread'inin içindeydi,
  // bağlamsız duruyordu (kullanıcı fark etti). Yetki kuralı aynı: yalnız bu
  // ustayla gerçekten bir mesaj thread'i başlatmış (kendi profili olmayan)
  // ziyaretçi görür — API zaten bunu zorunlu kılıyor, burada da aynı koşulu
  // önceden kontrol edip widget'ı yalnız uygunsa gösteriyoruz.
  const myContactFeedbackThread = viewerId && !isOwnProfile
    ? await prisma.expertMessageThread.findUnique({
        where: { expertProfileId_initiatorId: { expertProfileId: profile.id, initiatorId: viewerId } },
        select: { id: true },
      })
    : null;
  const myExistingFeedback = myContactFeedbackThread
    ? await prisma.expertContactFeedback.findUnique({
        where: { profileId_userId: { profileId: profile.id, userId: viewerId! } },
        select: { isAccurate: true },
      })
    : null;

  const notes = await prisma.expertNote.findMany({
    where: { profile: { slug }, status: "PUBLISHED", removedAt: null },
    select: {
      id: true, title: true, publishedAt: true, createdAt: true,
      model: {
        select: {
          name: true,
          brand: { select: { name: true } },
          products: {
            where: { isActive: true },
            orderBy: { weeklyViewCount: "desc" },
            take: 1,
            select: { slug: true },
          },
        },
      },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  const memberSince = profile.createdAt.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* flex-wrap + min-w-0: 320-360px genişlikte iki link yan yana
          sığmayabiliyordu (projenin bilinen mobil taşma hata sınıfı — 5
          alanlı review bulgusu). */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-semibold text-gray-500 mb-6">
        {/* ⟳ Aktif usta artık kendi işlerini /profil'den değil /usta-gorusu
            hub'ından yönetiyor (bkz. feature_usta_gorusum_hizli_erisim) —
            kendi profiline geri dönüş de oraya gitmeli, /profil'e değil
            (kullanıcı fark etti: "aktif usta neden profiline dönsün").
            Herkese açık ziyaretçi için "Ana sayfaya dön" değişmedi. */}
        {isOwnProfile ? (
          <Link href="/usta-gorusu" className="hover:text-gray-800 transition-colors min-w-0 truncate">← Usta Görüşüme dön</Link>
        ) : (
          <Link href="/" className="hover:text-gray-800 transition-colors min-w-0 truncate">← Ana sayfaya dön</Link>
        )}
        {/* Kendi profiline bakan aktif usta zaten ne olduğunu biliyor —
            "hakkında bilgi al" tanıtım linki yalnız ziyaretçiye gösterilir
            (kullanıcı fark etti). */}
        {!isOwnProfile && (
          <Link href="/usta-ol" className="hover:text-gray-800 transition-colors min-w-0 truncate">Usta Görüşleri hakkında bilgi al →</Link>
        )}
      </div>

      {/* Kimlik kartı — önceden düz metin yığını, kart yapısı yoktu (kullanıcı
          "görünüm kötü" dedi). Not sayısı + üyelik tarihi somut bir güven
          sinyali ekliyor — "neden bu ustaya bakmalıyım" sorusuna kısa bir
          cevap (kullanıcı: "ilgi çekici değil, neden kullanmalıyım
          göstermiyor"). Rozet+isim/il düzeni 3 uzman ajanlı bir tasarım
          turundan geçti (kullanıcı bir önceki dikey-yığın halini "sıradan"
          buldu, widget'ta paylaşılan öneriyi onayladı): rozet artık
          avatarın köşesindeki küçük bir ikon + başlığın yanındaki ufak bir
          "USTA" etiketi olarak ikiye bölündü, isim/il ikincil bilgi olarak
          başlığın altına döndü, alt istatistik satırı iki ayrı ikonlu veri
          noktasına ayrıldı, karta ince bir gölge eklendi. */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex items-start gap-3.5">
          {/* Önceden hiç avatar yoktu, yalnız metin — kullanıcının kendi
              önerisi üzerine (hesap isminin geçtiği her yere avatar). */}
          <div className="relative shrink-0">
            <Avatar displayName={profile.user.displayName} avatarUrl={profile.user.avatarUrl} seed={String(profile.user.id)} size={56} />
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] rounded-full bg-white flex items-center justify-center text-[11px] leading-none"
              style={{ border: `2px solid ${EXPERT_BADGE.color}` }}
            >
              {EXPERT_BADGE.icon}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{profile.headline}</h1>
              <span
                className="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded"
                style={{ color: EXPERT_BADGE.color, background: EXPERT_BADGE.bg }}
                title={EXPERT_BADGE.tooltip}
              >
                {EXPERT_BADGE.label.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {profile.user.displayName}
              {profile.city && ` · ${profile.city}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3.5 pt-3 border-t border-gray-50 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">📝</span>
            <span className="font-semibold text-gray-700">{notes.length}</span> usta görüşü
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">📅</span>
            {memberSince}&apos;den beri
          </span>
        </div>
      </div>

      {/* Çalışma yeri fotoğrafları — önceden sayfanın en başındaydı, kullanıcı
          bunu kimlik kartı ile Uzmanlık Alanları arasına taşımamızı istedi
          ("usta profil başlığı kısmının altına, Uzmanlık Alanlarının
          üstüne"). Kimlik doğrulama belgesi DEĞİL, ustanın kendi beyanına
          dayanır (aşağıdaki feragat cümlesi bunu açıklıyor). Fotoğraf yoksa
          bölüm tamamen gizlenir — boş placeholder "eksik profil" izlenimi
          verir (3 ajanlı UX/güven-güvenlik kararı). */}
      {sortedWorkplacePhotos.length > 0 && (
        <div className="mb-6">
          <WorkplacePhotoSlider photos={sortedWorkplacePhotos} />
          {/* Güven & güvenlik ajanı önerisi — bu görsel bir kimlik doğrulaması
              değil, ustanın kendi beyanı; ContactSettingsForm'daki aynı
              dürüstlük ilkesinin buradaki karşılığı. */}
          <p className="text-[11px] text-gray-400 px-1">
            Fotoğraflar ustanın kendi beyanına dayanır, fikape işletmeye ait olduğunu doğrulamaz.
          </p>
        </div>
      )}
      {isOwnProfile && sortedWorkplacePhotos.length === 0 && (
        <p className="text-xs text-gray-400 mb-6">
          Henüz çalışma yeri fotoğrafı eklemediniz —{" "}
          <Link href="/usta-gorusu/profil" className="text-link hover:underline">profilinize ekleyin →</Link>
        </p>
      )}

      {(profile.expertiseTags.length > 0 || profile.bio) && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 space-y-5">
          {profile.expertiseTags.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Uzmanlık Alanları</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.expertiseTags.map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{t}</span>
                ))}
              </div>
            </div>
          )}

          {profile.bio && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Hakkında</p>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>
      )}

      {!promotionPaused &&
        profile.contactVisible &&
        notes.length >= CONTACT_VISIBILITY_MIN_PUBLISHED_NOTES &&
        (profile.businessName || profile.contactPhone || profile.contactAddress) && (
        <div className="mb-8 bg-gray-50 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">İletişim</p>
          {profile.businessName && <p className="text-sm font-semibold text-gray-900">🏢 {profile.businessName}</p>}
          {/* Mobilde numarayı kopyalayıp aramak yerine doğrudan dokunup
              aranabilsin diye tel: linki — kullanıcı fark etti. Görünen
              metin girildiği gibi kalır, yalnız href normalize edilir. */}
          {profile.contactPhone && (
            <p className="text-sm text-gray-800">
              📞 <a href={`tel:${toTelHref(profile.contactPhone)}`} className="hover:underline">{profile.contactPhone}</a>
            </p>
          )}
          {profile.contactAddress && (
            <div>
              <p className="text-sm text-gray-800">📍 {profile.contactAddress}</p>
              {/* Harita önizlemesi. Google'ın API anahtarsız embed'i (q=<adres>)
                  düzensiz/apartman-adlı Türkçe adreslerde net bir nokta
                  bulamayıp yalnız genel bölgeyi gösteriyordu, hiç iğne
                  koymuyordu (kullanıcı fark etti). Adres kaydedilirken artık
                  bir kerelik Nominatim (OSM) ile geocode ediliyor
                  (contactLat/contactLng) — koordinat varsa OSM embed KESİN
                  bir iğneyle gösterir; geocode başarısızsa (nadiren) eski
                  genel-bölge Google embed'ine düşülür. */}
              <div className="mt-2 rounded-xl overflow-hidden border border-gray-100">
                {profile.contactLat != null && profile.contactLng != null ? (
                  <iframe
                    title="Konum haritası"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${profile.contactLng - 0.006}%2C${profile.contactLat - 0.004}%2C${profile.contactLng + 0.006}%2C${profile.contactLat + 0.004}&layer=mapnik&marker=${profile.contactLat}%2C${profile.contactLng}`}
                    width="100%"
                    height="160"
                    loading="lazy"
                    style={{ border: 0, display: "block" }}
                  />
                ) : (
                  <iframe
                    title="Konum haritası"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(profile.contactAddress)}&output=embed`}
                    width="100%"
                    height="160"
                    loading="lazy"
                    style={{ border: 0, display: "block" }}
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )}
              </div>
              {/* "Haritada Aç" önceden adres metninin ortasına sıkışmış inline
                  bir link gibiydi ("kötü gözüküyor") — artık haritanın altında,
                  kendi başına bir mini-buton. */}
              {/* Koordinat varsa "query=lat,lng" ile Google Maps'te de KESİN
                  bir iğne açılır — metin aramasıyla aynı belirsizlik burada
                  da vardı (kullanıcı fark etti). Koordinat yoksa (nadir
                  geocode başarısızlığı) eski adres-metni aramasına düşülür. */}
              <a
                href={
                  profile.contactLat != null && profile.contactLng != null
                    ? `https://www.google.com/maps/search/?api=1&query=${profile.contactLat}%2C${profile.contactLng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.contactAddress)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-link hover:underline"
              >
                Google Maps&apos;te aç
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          )}
          {contactFeedbackText && (
            <p className="text-[11px] font-semibold text-green-700">✓ {contactFeedbackText}</p>
          )}
          {myContactFeedbackThread && (
            <ContactFeedbackWidget expertProfileId={profile.id} initialValue={myExistingFeedback?.isAccurate ?? null} />
          )}
          <p className="text-[11px] text-gray-400 pt-1 leading-relaxed">
            Bu bilgi ustanın kendi beyanıdır, fikape tarafından doğrulanmaz. fikape, kurduğunuz iş
            ilişkisinin tarafı değildir; işçilik veya onarım kalitesini garanti etmez.
          </p>
        </div>
      )}

      {canMessage && (
        <div className="mb-8">
          <ExpertMessageComposer expertProfileId={profile.id} />
        </div>
      )}
      {viewerId && !isOwnProfile && isBlocked && (
        <p className="mb-8 text-xs text-gray-400">Bu ustayla mesajlaşamazsınız.</p>
      )}
      {viewerId && !isOwnProfile && !isBlocked && !profile.messagingEnabled && (
        <p className="mb-8 text-xs text-gray-400">Bu usta şu anda site üzerinden mesaj almıyor.</p>
      )}

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          Usta Görüşleri {notes.length > 0 && `(${notes.length})`}
        </p>
        {notes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center text-sm text-gray-400">
            {isOwnProfile
              ? <>Henüz bir usta görüşü paylaşmadınız. <Link href="/usta-gorusu/yaz" className="text-link font-semibold hover:underline">İlk görüşünüzü yazın →</Link></>
              : "Bu usta henüz bir görüş paylaşmamış."}
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((n) => {
              const productSlug = n.model.products[0]?.slug;
              const modelName = `${n.model.brand.name} ${stripModelGenRange(n.model.name)}`;
              return productSlug ? (
                <Link
                  key={n.id}
                  href={`/araclar/${productSlug}?sekme=usta-gorusleri`}
                  className="block bg-white border border-gray-100 rounded-xl p-3.5 hover:border-gray-300 transition-colors"
                >
                  <p className="text-xs text-gray-400">{modelName}</p>
                  <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                </Link>
              ) : (
                <div key={n.id} className="bg-white border border-gray-100 rounded-xl p-3.5">
                  <p className="text-xs text-gray-400">{modelName}</p>
                  <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
