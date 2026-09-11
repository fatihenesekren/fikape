# Usta Görüşleri — Konsolide Plan v3 (5 ajan review + §18 mini kararlar + kurucu kilit kararları)

fikape.com · 2026-09-10 · v1 → v2: 5 uzman ajan (KVKK, marka, monetizasyon, trust/moderasyon, UX/teknik) review etti. v2 → v3: §18 mini kararlar bir ürün/ops ajanıyla kapatıldı, kurucu kilit kararları işlendi. Değişen/eklenen yerler **⟳** ile işaretli. **Bu sürüm uygulanabilir referanstır.**

**Kurucu kilit kararları:** tek teslim · feragat satırı sabit ("Usta görüşleri, ustaların gönüllü teknik katkısıdır. fikape puanını etkilemez, sıralamada yer değiştirmez.") · usta sayısı büyüyebilir (kalıcı tavan yok) · Q&A B modeli · rozet "Usta" · "Teknik Çalışan" yok.

**⚠️ 11 Eylül 2026 güncellemesi:** Bu dosyadaki "belge doğrulama" / "Doğrulanmış Usta" ile ilgili tüm bölümler (§5.2 belge kontrolü, §5.3 belge işleme/imha, §392 granüler rıza (a) belge doğrulama) **KALDIRILDI** — kimlik/meslek belgesi hiç istenmez/saklanmaz, kurucu kararı. Detay ve gerekçe: hafıza dosyası `feature_usta_gorusleri_ilerleme.md`. Bu dosya güncellenmedi (yalnız işaretlendi), aşağıdaki ilgili bölümleri okurken bunu göz önünde bulundurun.

---

## 0. Kurucunun kilit yön kararları (değişmedi — veri)

- Faz ayrımı YOK — içerik + herkese açık usta profili + açık iletişim + site-içi mesajlaşma + aylık barem + bölgesel görünürlük tek projede.
- Açık adres + telefon yayınlanır + site-içi maskeli mesajlaşma da kurulur.
- Pilot YOK — başvuru herkese açık; admin onayı zorunlu.
- Barem ilk günden formülle çalışır — eşikler gizli, admin override iki yönde.
- İleride ustadan ücret alınabilir — "hak edilen görünürlük" ile "ücretli öne çıkarma" mimaride baştan ayrık.

> **⟳ v2 genel uyarı — efor:** UX ajanı iş kırılımını denetledi: maskeli mesajlaşma (takas deneyimi = haftalarca iş) + barem itiraz akışı ayrı kalemler; ContentReport/Answer şema değişiklikleri + cache invalidation planda yoktu. **Gerçekçi efor ~7-8 hafta değil, ~10-12 hafta odaklı solo iş.**

---

## 1. Amaç ve konumlanma  ⟳

- **Skorsuz.** FI·KA·PE ortalamasına ve yorum sayısına sıfır etki. Her yüzeyde "puan tablosu dışında".
- **Çerçeve dili:** "katkı / uzmanlık / teknik görüş". Kullanıcıya dönük metinde **"reklam / ilan / sponsor / tanıtım" kelimeleri kullanılmaz** — ve **bir kelimeyi olumsuzlayarak da kullanılmaz** ("reklam değildir" bile zihne sokar; bu ifade yalnızca "Usta Görüşleri Nedir?" açıklama sayfasında kalır).
- **⟳ İç terminoloji de temiz:** "bölgesel tanıtım" → **"bölgesel görünürlük"** / **"bölgesel eşleşme"**. Hiçbir katmanda (kod, admin, bildirim) "tanıtım" bırakılmaz.
- **⟳ Konumlanma cümlesi:** "ustanın müşteriyle buluştuğu" → **"kullanıcının ustaya ulaşabildiği"**. Kullanıcıya dönük hiçbir yüzeyde "müşteri / potansiyel müşteri / lead" geçmez.
- **Çift şapka:** "usta" bir `User` niteliğidir. Aynı kişi hem kendi aracına normal sahiplik yorumu (skora katılır) hem herhangi bir modele usta notu (skorsuz) yazar.
- **⟳ Skorlu/skorsuz duvarı (marka S1.1):** Ustanın **sahiplik yorumundaki** yazar satırı, usta profiline veya iletişim bilgisine **asla derin link vermez**; yalnızca "bu üye doğrulanmış usta" bilgi rozeti gösterir ve rozet yalnızca "Usta Görüşleri Nedir?" sayfasına gider.

---

## 2. Kilitli kararlar tablosu

| # | Karar |
|---|---|
| Ad | Tab başlığı "Usta Görüşleri"; tekil öğe "Usta Notu" |
| Rozet | "Doğrulanmış Usta" + tooltip: *"Teknik geçmişi belgeyle fikape tarafından doğrulandı. Bu bir tavsiye veya iş birliği değildir."* Ayrı ikon (🔧), TrustLevel rozetlerinden ayrık |
| İçerik seviyesi | **Model** seviyesi; `Review`'a dokunulmaz, ayrı `ExpertNote` |
| UI | Araç detay sayfasında ayrı "Usta Görüşleri" tab'ı; modelde `PUBLISHED` not yoksa tab render edilmez |
| Oylar | Her notun altında faydalı / faydasız (`ExpertNoteVote`) + kendi notuna oy engeli |
| Not-altı Q&A | **B modeli:** soruyu herkes sorar, cevabı yalnızca notun ustası (veya diğer doğrulanmış ustalar); **⟳ her cevap `Answer.status` ile moderasyondan geçer**; iletişim bilgisi filtrelenir |
| Barem sayımı | Yalnızca onaylı `ExpertNote` (+ zayıf/tavanlı not-altı usta cevapları). Sahiplik yorumları **asla**. Usta→usta oyları hariç |
| Hesap kapanışı | Anonimleştir + notlar kalır; **⟳ iletişim PII'si silme *talebi anında* sıfırlanır** (30 gün SLA beklenmez); ihlalle ban → notlar `HIDDEN + removedAt` (hard-delete yok) |
| CV durunca | Usta notları görünür kalır; yalnızca tanıtım/görünürlük yüzeyi durur |
| Monetizasyon | Para asla barem/rozet/sıralama/not görünürlüğünü etkilemez; ileride ücretli yüzey **açık "Reklam / Sponsorlu" etiketiyle**, editoryal ve hak-edilen katmandan duvarla ayrık |

---

## 3. Veri modeli  ⟳ (review sonrası genişletildi)

### 3.1 Çekirdek modeller

```prisma
model ExpertProfile {
  id       Int  @id @default(autoincrement())
  userId   Int  @unique
  user     User @relation(fields: [userId], references: [id])

  slug          String   @unique            // /usta/[slug] — oluşturmada DONDURULUR
  headline      String?  @db.VarChar(120)
  bio           String?  @db.VarChar(2000)
  photoUrl      String?
  city          String?  @db.VarChar(50)
  district      String?  @db.VarChar(60)
  expertiseTags String[] @default([])

  contactPhone   String? @db.VarChar(20)
  contactAddress String? @db.VarChar(300)   // opsiyonel; il/ilçe zorunlu
  contactVisible Boolean @default(false)
  cvNoindex      Boolean @default(false)

  status     ExpertStatus @default(PENDING_VERIFICATION)
  verifiedAt DateTime?
  verifiedBy Int?

  // ⟳ Barem / görünürlük
  visibilityState    ExpertVisibility @default(HIDDEN)
  graceUntil         DateTime?        // ⟳ S2: ACTIVE'e geçişte +2 ay
  lastScoredAt       DateTime?
  currentPeriodScore Float?
  adminOverride      ExpertOverride?

  // ⟳ Monetizasyon dikişi — kaynak-of-truth ExpertSponsorship; burası cache
  sponsoredUntilCache DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  notes         ExpertNote[]
  scoreHistory  ExpertScoreSnapshot[]
  contactEvents ExpertContactEvent[]
  sponsorships  ExpertSponsorship[]
  overrideEvents ExpertOverrideEvent[]

  @@index([status, visibilityState])
  @@index([city, visibilityState])
  @@map("expert_profiles")
}

enum ExpertStatus { PENDING_VERIFICATION  ACTIVE  WAITLISTED  SUSPENDED  CLOSED }  // ⟳ WAITLISTED eklendi (B3)
enum ExpertVisibility { HIDDEN  FEATURED  PAUSED  PROBATION }                       // ⟳ PROBATION tanımlandı (S2/A1)
enum ExpertOverride { FORCE_FEATURED  FORCE_PAUSED }

model ExpertNote {
  id        Int           @id @default(autoincrement())
  profileId Int
  profile   ExpertProfile @relation(fields: [profileId], references: [id])
  modelId   Int
  model     Model @relation(fields: [modelId], references: [id])

  title      String @db.VarChar(140)
  body       String @db.Text
  structured Json   @default("{}")

  status          ExpertNoteStatus @default(PENDING)
  qualityScore    Int?             // admin onayda 0/1/2 (⟳ rubrik §8)
  approvedQualityScore Int?        // ⟳ S12: onay anındaki puan — barem BUNU okur
  publishedAt     DateTime?
  rejectedAt      DateTime?
  rejectionReason String?          @db.VarChar(300)
  removedAt       DateTime?        // ⟳ S4: ban/takedown soft-remove

  editedAt  DateTime?
  editCount Int       @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  votes            ExpertNoteVote[]
  questions        Question[]
  versions         ExpertNoteVersion[]
  contentReports   ContentReport[]
  takedownRequests ExpertNoteTakedownRequest[]   // ⟳
  externalReplies  ExpertNoteExternalReply[]     // ⟳

  @@index([modelId, status])
  @@index([profileId, status])
  @@map("expert_notes")
}

enum ExpertNoteStatus { PENDING  PUBLISHED  REJECTED  HIDDEN }

model ExpertNoteVote {
  id        Int  @id @default(autoincrement())
  noteId    Int
  note      ExpertNote @relation(fields: [noteId], references: [id])
  userId    Int
  user      User @relation(fields: [userId], references: [id])
  isHelpful Boolean
  voteConfidence Float @default(1)   // ⟳ C3: gecelik oy-sahteciliği işi yazar [0-1]
  createdAt DateTime @default(now())
  @@unique([noteId, userId])
  @@map("expert_note_votes")
}

model ExpertNoteVersion {
  id Int @id @default(autoincrement())
  noteId Int
  note ExpertNote @relation(fields: [noteId], references: [id])
  version Int
  title String
  body String @db.Text
  structured Json @default("{}")
  approvedQualityScore Int?          // ⟳ S12
  createdAt DateTime @default(now())
  @@unique([noteId, version])
  @@map("expert_note_versions")
}

model ExpertScoreSnapshot {
  id Int @id @default(autoincrement())
  profileId Int
  profile ExpertProfile @relation(fields: [profileId], references: [id])
  period String @db.VarChar(7)      // "2026-09"
  distinctModelQualityNotes Int     // ⟳ A2
  qualityAvgNorm Float              // ⟳ A8: dönem platform ortalamasına normalize
  helpfulWilson Float               // ⟳ A3: Wilson alt sınırı
  voterDiversity Float              // ⟳ A4
  reportRate Float
  penalties Float
  rawScore Float
  decision ExpertVisibility
  wasSponsored Boolean @default(false)   // ⟳ R11
  placementImpressions Int @default(0)   // ⟳ R11
  createdAt DateTime @default(now())
  @@unique([profileId, period])
  @@map("expert_score_snapshots")
}

// ⟳ R10: her override gerekçe koduyla loglanır → formül gerçeğe karşı kalibre edilir
model ExpertOverrideEvent {
  id Int @id @default(autoincrement())
  profileId Int
  profile ExpertProfile @relation(fields: [profileId], references: [id])
  period String @db.VarChar(7)
  fromState ExpertVisibility
  toState ExpertVisibility
  reasonCode String @db.VarChar(40)
  adminId Int
  createdAt DateTime @default(now())
  @@map("expert_override_events")
}
```

### 3.2 ⟳ Dönüşüm ölçümü (monetizasyon hazırlığı — KVKK: usta açısından kişisel veri)

```prisma
model ExpertContactEvent {
  id Int @id @default(autoincrement())
  profileId Int
  profile ExpertProfile @relation(fields: [profileId], references: [id])
  kind ExpertContactEventKind          // ⟳ R3: string değil enum
  surface ExpertPlacementSurface       // ⟳ R3
  placementReason PlacementReason       // ⟳ R2
  regionBucket String @db.VarChar(40)  // ⟳ R3: istek anındaki kaba şehir; ziyaretçi tanımlayıcısı TUTULMAZ
  dedupeKey String @db.VarChar(64)     // ⟳ R3: gün + kaba oturum hash — şişme önleme
  createdAt DateTime @default(now())
  @@index([profileId, createdAt])
  @@map("expert_contact_events")
}
enum ExpertContactEventKind {
  PROFILE_VIEW  CONTACT_REVEAL  MESSAGE_START  MESSAGE_REPLIED  THREAD_REACHED_DEPTH_3   // ⟳ R4
}
enum ExpertPlacementSurface { VEHICLE_PAGE  EXPERT_PROFILE  REGIONAL_BLOCK  MODEL_TAB  SEARCH }
enum PlacementReason { EARNED  SPONSORED  EDITORIAL_PICK }   // ⟳ R2 — her yerleşim bunu taşır

// ⟳ R-ek: aylık bölge rollup — fiyatlama girdisi + "özellik nerede çalışıyor" iç panosu
model ExpertRegionStat {
  id Int @id @default(autoincrement())
  period String @db.VarChar(7)
  regionBucket String @db.VarChar(40)   // ⟳ İLÇE granülerliğinde logla — il'e sonradan toplarsın, il'i bölemezsin
  expertCount Int
  featuredCount Int
  noteCount Int
  contactEventCount Int
  modelsCovered Int
  createdAt DateTime @default(now())
  @@unique([period, regionBucket])
  @@map("expert_region_stats")
}
```

### 3.3 ⟳ Sponsorluk / sertifikasyon dikişi (R1, R7 — bugün tablo + enum, UI yok)

```prisma
model ExpertSponsorship {
  id Int @id @default(autoincrement())
  profileId Int
  profile ExpertProfile @relation(fields: [profileId], references: [id])
  kind SponsorshipKind
  status SponsorshipStatus @default(PENDING_PAYMENT)
  startsAt DateTime?
  endsAt DateTime?
  scopeCities String[] @default([])
  scopeDistricts String[] @default([])
  scopeModelIds Int[] @default([])
  soldByAdminId Int?
  priceMinorUnits Int?
  currency String? @db.VarChar(3)
  externalInvoiceRef String?
  paymentStatus String? @db.VarChar(24)
  // ⟳ R7: "Fikape Onaylı Servis" sertifikasyon alt-alanları (şimdilik null)
  assessedAt DateTime?
  assessedBy Int?
  expiresAt DateTime?
  revokedAt DateTime?
  note String? @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([profileId, status])
  @@map("expert_sponsorships")
}
enum SponsorshipKind { SPONSORED_EXPERT  APPROVED_SERVICE }
enum SponsorshipStatus { PENDING_PAYMENT  ACTIVE  EXPIRED  CANCELLED }
```

### 3.4 ⟳ Üretici/3. kişi bildirim-kaldırma + yanıt hakkı (UX ajanı — yeni)

`ExpertNoteTakedownRequest` + `ExpertNoteExternalReply` modelleri + enum'lar — tam şema **hukuki-metinler-v1.md → Takedown Prosedürü** ekinde. Özet:
- Not **hard-delete edilmez** → `ExpertNote.status=HIDDEN + removedAt`.
- Yanıt hakkı: kimliği teyitli marka temsilcisi, notun altında açık etiketli tek blok ("Üretici / Marka Yanıtı" 🏭), moderasyonlu, **oy almaz, bareme girmez, skora etki etmez**.
- 72 saat geçici gizleme eşiği (yalnız somut/ağır iddia); 15 gün inceleme; tek itiraz.

### 3.5 ⟳ Mevcut modellere eklemeler (review sonrası düzeltilmiş)

```prisma
// User
expertProfile   ExpertProfile?
expertNoteVotes ExpertNoteVote[]
takedownClaims  ExpertNoteTakedownRequest[] @relation("TakedownClaimant")

// Model
expertNotes ExpertNote[]

// ⟳ Question — S1/S3: productId nullable + expertNoteId XOR
productId    Int?
product      Product?    @relation(fields: [productId], references: [id])   // ⟳ opsiyonel yapıldı
expertNoteId Int?
expertNote   ExpertNote? @relation(fields: [expertNoteId], references: [id])
@@index([expertNoteId])

// ⟳ Answer — S3: moderasyon alanları (paylaşılan tabloya değişiklik!)
status                  AnswerStatus @default(PENDING)   // PENDING | PUBLISHED | REJECTED
answeredByExpertProfileId Int?
// → mevcut TÜM Answer sorgularına status='PUBLISHED' filtresi eklenecek

// ⟳ ContentReport — S1: EXPERT_NOTE hedefi
// productId  → DROP NOT NULL
// expertNoteId Int? + ilişki
// CHECK: (targetType='EXPERT_NOTE') = (expertNoteId IS NOT NULL AND productId IS NULL)
// ContentReportTargetType enum → + EXPERT_NOTE

// ⟳ ConsentLog — S-ek: sürüm alanı
consentVersion String?

// ⟳ ConsentType enum → EXPERT_DOC_VERIFICATION, EXPERT_CONTACT_PUBLIC,
//                       EXPERT_REGIONAL_PROMO, EXPERT_PERFORMANCE_ANALYTICS
// ⟳ NotificationType enum → EXPERT_NOTE_PUBLISHED, EXPERT_NOTE_REJECTED, EXPERT_VERIFIED,
//    EXPERT_CV_PAUSED, EXPERT_CV_RESTORED, ADMIN_NEW_EXPERT_NOTE, ADMIN_NEW_EXPERT_APPLICATION,
//    ADMIN_NEW_TAKEDOWN_REQUEST, EXPERT_NOTE_TAKEDOWN_FILED, EXPERT_NOTE_INTERIM_HIDDEN,
//    EXPERT_NOTE_TAKEDOWN_RESOLVED
```

### 3.6 Elle SQL notları
- `prisma migrate` bu ortamda yok — Supabase SQL Editor. Mümkünse branch DB'de test.
- `ALTER TYPE ... ADD VALUE` transaction'da çalışmaz, geri alınamaz → **tüm enum değerlerini ilk seferde eksiksiz** yaz.
- `Question` XOR + `ContentReport` shape CHECK'leri (UX ajanı SQL'i verdi — §3.5 mantığı).
- `ExpertNote`'a `removedAt`; ban/takedown yolu **hard-delete kullanmaz** (site geneli RESTRICT FK — `ExpertNoteVote`, `Question`, `ExpertNoteVersion`, `ContentReport` çocukları violation atar).

---

## 4. Çift şapka & yazma akışı

- **Ayrı rota:** `/usta-gorusu/yaz` — yalnız `ExpertStatus = ACTIVE` ustalara. `ReviewForm`'a dokunulmaz.
- Model seçici + `structured` alanlar + serbest gövde.
- Ustanın kendi aracına sahiplik yorumu normal akışta; yazar satırında "Doğrulanmış Usta" bilgi rozeti (⟳ CV'ye link YOK — §1).
- **⟳ S12:** `PUBLISHED` nota yapılan her düzenleme notu `PENDING`'e döndürür ve **barem katkısını yeniden onaya kadar dondurur**; barem `approvedQualityScore`'u okur, canlı `qualityScore`'u değil.

---

## 5. Başvuru & doğrulama  ⟳

### 5.1 Akış
- `/profil` → başvuru formu: headline, uzmanlık etiketleri, il/ilçe, bio, belge yükleme, **beyan kutusu** (galerici/pazarlamacı/marka-yetkili servis değil), **⟳ 18 yaş / fiil ehliyeti beyanı ve kontrolü** (KVKK asgari #8 — yayımlanacak veri için geçerli rıza şartı).
- `PENDING_VERIFICATION` → admin belge kontrolü → `ACTIVE` (+ `graceUntil = now + 2 ay`).

### 5.2 ⟳ Başvuru akış kontrolü (Trust B1-B5 + §18 — kalıcı tavan değil, operasyonel güvenlik valfi)
- **Başvuru penceresi:** form her ayın **ilk 7 günü** açık; kapalıyken e-posta bekleme listesi.
- **⟳ Kademeli kota K:** Ay 1-2: **K = 3** · Ay 3-6: **K = 5** · Ay 6+: koşullu büyüme, pencere başına **K_max = 8**. Fazlası `WAITLISTED` + sıra no; sonraki pencerede otomatik yükselir.
  - **Büyüme kuralı:** pencere sonunda medyan not-onay gecikmesi < 3 gün **ve** bekleyen kuyruk < 20 **ve** haklı şikâyet birikmesi yok → koşul **2 pencere üst üste** sağlanırsa `K += 1` (tavan 8).
- **⟳ Backpressure (sıkılaştırıldı — kademeli):**
  - **Yumuşak:** kuyruk > **15** **veya** medyan onay gecikmesi > **3 gün** → sonraki pencerede **K yarıya iner** (pencere atlanmaz).
  - **Sert:** kuyruk > **25** **veya** gecikme > **4 gün** → sonraki başvuru penceresi **atlanır**, sonraki açılışta K **3'e sıfırlanır**.
- Bu mekanizma "~15-25 aktif usta"yı bir hedef değil, moderasyon sağlığının doğal sonucu kılar; sağlık sürdükçe K büyür.

### 5.3 ⟳ Belge işleme (KVKK 5.1-5.5 — "tercihen" temennileri kurala çevrildi)
- **Tam belge görseli SAKLANMAZ**; doğrulama biter bitmez, **en geç 30 gün** içinde imha. İstisna: somut sahtecilik şüphesi / devam eden itiraz → yazılı gerekçeyle kilitli arşiv.
- Saklanan: "doğrulandı: [tür] / [tarih] / [kontrol eden] / [kontrol tarihi]" özeti.
- **⟳ Reddedilen başvuru:** tüm belgeler + pHash **15 gün** içinde imha; yalnız "başvuru / red + tarih + gerekçe kodu" **24 ay**.
- **⟳ pHash:** kişisel veri; hukuki sebep meşru menfaat (m.5/2-f); belge imha edilse de **24 ay**; aydınlatmada açık; **tek başına ret sebebi değil, manuel inceleme tetikler**.
- **⟳ Yurtdışı:** belgeler KVKK m.9 mekanizması (uygun ülke / standart sözleşme) devreye girmeden yurtdışına aktarılmaz; bucket tercihen AB bölgesi; **Vercel katmanında belge işlenmez/önbelleğe alınmaz**.
- **⟳ İşyeri fotoğrafında 3. kişi/plaka:** olduğu gibi saklanmaz. De-identifiye edilebiliyorsa yalnız o sürüm; edilemiyorsa **fotoğraf reddedilir**. Bulanıklaştırma = kısmi imha, loglanır.

### 5.4 ⟳ Koordineli başvuru tespiti (Trust C1)
Başvuru inceleme panosu her bekleyen başvuru için gösterir: IP / cihaz parmak izi / telefon / bina düzeyi adres paylaşan **veya** son 30 günde aynı ilçeden doğrulanmış diğer başvuru/ustalar. Eşleşme → onay öncesi açık admin ack zorunlu. Belge pHash zaten "bir işletme = bir slot".

---

## 6. UI yerleşimi  ⟳

### Araç detay sayfası
- **Ayrı "Usta Görüşleri" tab'ı.** Modelde `PUBLISHED` not yoksa render edilmez.
- **⟳ S5:** `TabView` union `"usta-gorusleri"` ile genişler (TabView + `ReportContent.activeTab` + switch — ~4 dosya); `?tab=usta-gorusleri` deep-link; server'da `hasPublishedExpertNotes = expertNote.count({modelId, status:PUBLISHED})`.
- **⟳ S6:** Not `PUBLISHED`/`HIDDEN` olduğunda o modelin **tüm** Product slug'ları için `revalidatePath` (yazma tarafında 2. Model→Products fan-out) — yoksa tab prod'da geç/hiç görünmez.
- **Not kartı:** "Doğrulanmış Usta" rozeti (🔧 + tooltip) · **⟳ yalnız il** (ilçe sadece profilde) · konum **bağlam olarak** ("İzmir'de servis veriyor"), dizin girişi gibi değil · `structured` alanlar · gövde · faydalı/faydasız · açılır not-altı Q&A (B modeli).
- **⟳ Feragat satırı (KİLİTLENDİ — kurucu kararı):** *"Usta görüşleri, ustaların gönüllü teknik katkısıdır. fikape puanını etkilemez, sıralamada yer değiştirmez."* "reklam değil / ödeme karşılığı değil" ifadesi hiçbir sabit yüzeyde kullanılmaz; yalnız "Usta Görüşleri Nedir?" sayfasında kalır.

### Araç kartı (grid)  ⟳ §18
- **"🔧 Usta Görüşleri (n)" rozeti LANSMANDA EKLENMEZ.** Gerekçe: sayılı grid rozeti dizin-endeksi sinyali (§1, §14.16); kart zaten yıl + yerli/milli + kategori taşıyor, anahtar rozet FI·KA·PE skoruyla yarışır; düşük hacimde birkaç kart orantısız vurgu alır (§14.4 ihlali).
- **Yeniden değerlendirme tetiği:** bir kategorideki kataloglu modellerin ~%40'ı ≥1 `PUBLISHED` not aldığında bakılır. Keşif istenirse alternatif: tek bir site-düzeyi "Usta Görüşleri olan modeller" göz-atma sayfası (grid'i temiz tutar).

### Usta profili — `/usta/[slug]`
- Bölümler: **Uzmanlık alanları · Katkıları · Doğrulama · (rıza verildiyse) İletişim**. Ağır ticari dil ("randevu al", "fiyat") yok. Editoryal içeriğin **yanında** iletişim CTA'sı yok — CTA sadece bu sayfada.
- `slug` oluşturmada dondurulur; admin değişikliğinde 301.
- **⟳ S7:** erişim/JSON-LD/bölgesel blok/not→profil linki **her yerde `status='ACTIVE' AND visibilityState='FEATURED'`** koşuluna bağlı. `PAUSED`/`PROBATION`/`SUSPENDED` iken: sayfa 200 + `noindex` + "şu anda görüntülenemiyor" (neden yazılmaz).

---

## 7. İletişim katmanı  ⟳

- Açık adres + telefon — **il/ilçe zorunlu, açık sokak adresi opsiyonel** — **+ site-içi maskeli mesajlaşma** (takas `MessageThread` deseni).
- **Granüler açık rıza** (3 ayrı işaretsiz kutu): (a) belge doğrulama, (b) açık iletişim yayını + arama motoru indekslemesi, (c) bölgesel görünürlük. `ConsentLog` + `consentVersion` + zaman damgası, her biri bağımsız geri çekilebilir. Aydınlatma metni ayrı, önce.
- **⟳ 7.2:** (b) rızası verilmese de usta `ACTIVE` olur, not yazar, rozeti alır, bölgesel yüzeyde **yalnızca "site üzerinden mesaj"** seçeneğiyle görünür. Rıza hizmetin ön koşulu değil.
- **⟳ 7.1:** Rıza geri çekmede açık telefon/adres profilden **derhal** kaldırılır + sayfa `noindex` + sitemap'ten çıkarılır; dış propagasyon/deindeks talebi **en geç 72 saat** (72s "kaldırma" değil, dış yayılım).
- **⟳ 7.3:** Kullanıcı tarafı Gizlilik Politikası / mesajlaşma aydınlatması, usta mesajlaşmasını + içerik moderasyonunu + saklama süresini kapsayacak şekilde güncellenir.
- **⟳ 7.4:** Yayın öncesi **yazılı risk/denge değerlendirmesi** dosyalanır (kapsam, alternatifler, taciz/scraping azaltımı, ehliyet kontrolü).
- Telefon/adres **yalnızca** yapılandırılmış CV alanında; not gövdesi/Q&A/mesaj içeriğinde yasak → içerik filtresi bu üç yüzeye de uygulanır.
- **Kullanıcıya feragat** her not kartında + mesaj akışı başında (kısa metin — hukuki-metinler-v1.md Taslak 4).

---

## 8. Barem & görünürlük durum makinesi  ⟳ (Trust A1-A8, C2-C3; UX S2, S7, S8)

### Durumlar
`PENDING_VERIFICATION → ACTIVE` · görünürlük: `HIDDEN → FEATURED ⇄ PAUSED`, ceza yolu `PROBATION` · terminal `CLOSED` · ayrı eksen `SUSPENDED`.
- **⟳ S7:** `SUSPENDED → ACTIVE` geri alırken `visibilityState = HIDDEN` (bir sonraki cron yeniden hesaplar — stale `FEATURED` dönmesin). Cron `SUSPENDED`'a asla dokunmaz.
- **⟳ S8:** cron idempotent — `period` hesapla, snapshot `upsert`, geçişi yalnız karar değiştiyse uygula.

### ⟳ Grace (A1 — en büyük teşvik sızıntısı düzeltmesi)
Grace **tanıtım/bölgesel yüzeyi AÇMAZ.** Grace'te usta yalnız kendi notlarının üstünde ve `/usta/[slug]` profilinde görünür. **Bölgesel görünürlük** için grace'te bile şart:
- uygunluk kapısı (aşağıda) **+** mevcut notlardan hesaplanan geçici `rawScore ≥ 0.55` **+ ≥2 farklı modelde ≥3 onaylı not**.
- Grace'te pazarlama metni / marka kötüleme nedeniyle **tek ret** → grace biter, `PROBATION`.
- Grace sonrası ilk `PAUSED` düşüşü **tek ay** (histerezis yalnız toparlanma sonrası yeniden-pause için).

### Uygunluk kapısı (hepsi gerekli; yoksa `HIDDEN`)
1. ≥ **3 onaylı usta notu** (ömür boyu)
2. **⟳ A7:** Son **180 günde ≥ 1 onaylı ExpertNote** (Q&A cevabı `FEATURED` için sayılmaz; yalnız Q&A `ACTIVE` tutar)
3. Çözülmemiş haklı şikâyet yok
4. Moderasyon geçme oranı ≥ **%70**

### Görünürlük skoru (90 gün kayan, aylık cron)
| Ağırlık | Sinyal | ⟳ Değişiklik |
|---|---|---|
| %55 | Admin kalite puanı ort. (`approvedQualityScore` 0/1/2) | **A8:** rubrik somut (0 = uyumlu ama sığ/jenerik; 1 = spesifik, model-doğru, faydalı; 2 = istisnai derinlik + doğrulanabilir çok ayrıntı); **dönem içi platform ortalamasına normalize**; bir dönemde "2" oranı > %30 → öz-inceleme bayrağı |
| %20 | Model kapsamı | **A2:** `min(farklı_model_kaliteli_not, 3) / 3`. Sayılan not: model başına dönemde en fazla 1, ≥14 gün yaşında, `approvedQualityScore ≥ 1`. Aynı-model hacmi barem girdisi **değil** |
| %15 | Faydalı-oy | **A3:** ham oran değil **Wilson alt sınırı** (%90). 5+ oy = **≥5 farklı** TL≥2 hesap, oy anında hesap yaşı ≥60 gün. Esir-kitle (bu ustanın ≥N notuna oy yoğunluğu eşik aşan hesaplar) ve aynı-ilçe çapraz-oy kümesi hariç. **C3:** `× ort(voteConfidence)`; sayılan notların ≥2'sinde `voteConfidence < 0.5` → o dönem FEATURED **yükselişi dondurulur** (düşebilir) |
| %10 | Oy veren çeşitliliği | **A4:** `1 − (tekrar_eden_oycu_not_çiftleri / toplam)`, 90 gün. **Çarpan kapısı:** `voterDiversity < 0.5` ise tüm faydalı-oy terimi `voterDiversity` ile çarpılır |
| ceza | | **A5:** `− 0.15·min(onaylı_şikâyet,2)/2 − 0.05·(reddedilen_şikâyet_oranı > platform_p90)` + geçme oranı < %70 / marka yanlılığı / uykudalık → düş veya dondur |

`rawScore = 0.55·kaliteNorm + 0.20·min(farklıModelKaliteliNot,3)/3 + 0.15·helpfulWilson·ortVoteConfidence + 0.10·voterDiversity − penalties`
(ve `voterDiversity < 0.5` ise 3. terim `× voterDiversity`)

### Eşikler (sayılar **gizli**)
- **FEATURED:** `rawScore ≥ 0.55` **ve** sert ceza yok.
- **PAUSED'a düşme:** `rawScore < 0.40` **üst üste 2 ay** (histerezis). **⟳ S8:** < 2 snapshot varsa histerezisle PAUSE yok — yalnız uygunluk kapısı düşerse PAUSE.
- **⟳ S8: `PAUSED → FEATURED` toparlanma eşiği** (flip-flop önleme): `rawScore ≥ 0.55` **üst üste 2 ay** — yani aşağı ve yukarı eşikler asimetrik.
- **Admin override:** `FORCE_FEATURED` / `FORCE_PAUSED` — **⟳ R10:** her override `ExpertOverrideEvent`'e gerekçe koduyla yazılır.

### ⟳ Marka yanlılığı sert kuralı (Trust C2)
Bir usta, bir markanın `PUBLISHED` notlarının **> %40'ını** yazamaz **veya** tek markada net-olumsuz duygulu **> 5 not** giremez — ikinci gözden geçiren onayı olmadan.

### PAUSED / PROBATION etkisi
Profil sayfası 200+noindex · bölgesel görünürlük kalkar · notlardaki iletişim linki gizlenir · **rozet ve notlar kalır** · usta'ya bildirim + e-posta (**nitel** dil, sayı/eşik/kontrol listesi verilmez — metin: hukuki-metinler-v1.md).

### ⟳ İtiraz (Trust C4)
Usta başına **yuvarlanan 30 günde en fazla 2 itiraz**. İtiraz **14 gün** içinde incelenmezse orijinal karar otomatik kesinleşir. İlk kararı vermeyen yetkili inceler; ikinci itiraz yok.

### Barem girdisi  ⟳ §18
Yalnız `ExpertNote`. **Not-altı usta cevapları görünürlük/skora SIFIR ağırlıkla girer** — yalnızca uygunluk kapısı madde 2'yi (180 gün aktiflik) beslerler. Sahiplik yorumları hariç. `CLOSED`/`SUSPENDED` atlanır. (Sonra değerlendirilebilir: ustalar cevap vermeyi bırakırsa dönemde ≥3 esaslı moderasyondan geçmiş cevap için `rawScore`'a tavanı **+0.02** teşvik — asla tek başına eşik geçirtmez; şimdilik yok.)

---

## 9. Bölgesel görünürlük  ⟳ (marka S9.1-S9.2 + §18)

- `FEATURED` + kullanıcı bölgesi eşleşen ustalar araç sayfasında yüzeye çıkar.
- **⟳ §18 — Gösterim düzeyi İL.** Kullanıcıya sunulan eşleşme/blok düzeyi **il**. **İlçe yalnızca `/usta/[slug]` profilinde**, kullanıcının bilerek tıkladığı adımın ardında. (Event/log tarafı ilçe granülerliğinde tutulur — değişmez.)
- **⟳ §18 — Blok açılış eşiği:** bir model+ilde bölgesel blok yalnızca **≥ 3 farklı usta** `PUBLISHED` not yazmışsa **ve** bunların **≥ 2'sinde `approvedQualityScore ≥ 1`** **ve** **son 365 günde ≥ 1 not** varsa açılır. **Sert kapı** — kalibrasyon yükseltebilir, gevşetemez. Tek/iki usta = blok yok (§14.15).
- **⟳ Not birincil nesne:** blokta usta, yazdığı nottan bağımsız bir "kart" (foto + konum + "mesaj gönder") olarak sunulmaz. Önce katkı (not/başlık), sonra atıf.
- **⟳ Blokta telefon/adres YOK.** Blok yalnız nota veya profile götürür.
- **⟳ Blok başlığı:** *"[İl] çevresinde bu modele not yazan ustalar"*. **Sıra etiketi görünür ve dürüst:** "katkı tarihine göre" / "bu modeldeki not sayısına göre".
- **⟳ Yerellik varsayılan değil, opt-in filtre.** Varsayılan "Türkiye geneli, katkıya göre". Hiçbir ilde eşik dolmuyorsa bu liste gösterilir (not-birincil, iletişim yok, bölgesel çerçeve yok).
- **⟳ Büyük il (İstanbul/Ankara/İzmir):** bucket bölünmez; ilçe il-bloğu *içinde ikincil etiket/sıralama* olarak gösterilebilir. **[Kurucu kararı — sonra:** İstanbul'da gerçek yoğunluk oluşursa yaka-düzeyi (Anadolu/Avrupa) opt-in filtre eklensin mi — veriye bağlı.**]**
- Editoryal içeriğin (not, yorum, katalog) yanında iletişim CTA'sı yok.

---

## 10. Moderasyon operasyonu (tek kişilik ekip)

- Tüm notlar `PENDING` → admin onayı. **Oto-yayın başlangıçta KAPALI.**
- **Triaj risk skoru:** filtre deseni · marka + abartı/olumsuzluk sözlüğü · link · ilk 3 not · 90g geçme oranı < %80 · uzmanlık dışı marka.
- **Hacim tavanı:** sahiplik yorumundan ayrı, gevşek ama sınırlı — **3/gün, 10/hafta**.
- **⟳ Marka dağılımı:** reaktif izleme + **sert kural (C2, §8)**.
- **Oy sahteciliği** gecelik iş → `ExpertNoteVote.voteConfidence` [0-1] yazar: TrustLevel karışımı · hesap yaşı · zaman kümelenmesi · IP/cihaz örtüşmesi · usta→usta kenarları · esir-kitle · aynı-ilçe çapraz-oy.
- **Şikâyet yoğunlaşması:** hep tek ustayı raporlayan hesaplar + orantısız şikâyet üreten ustalar.
- **Kill switch:** tüm `ExpertNote` katmanını gizleyen tek bayrak.
- **⟳ §18 — Oto-yayın (İLK TESLİM DIŞI, sonraki iterasyon):** `N = 20` ardışık temiz onay (usta bazında) + tüm kapılar: usta `ACTIVE` + `FEATURED` · 90g geçme oranı ≥ %95 · ömür boyu haklı şikâyet = 0 · not triaj risk skorunda düşük eşiğin altında · **rakip markayı net-olumsuz anan notlarda asla** · yayın-sonrası %20 örneklem yeniden okuma · **açıldıktan sonra tek ret → o usta için oto-yayın iptal**, tam manuele dönüş, sayaç sıfırlanır.
- **Ölçek tavanı ~15-25 aktif usta** — **⟳ §5.2 backpressure** bunu uygulayan mekanizma.

---

## 11. Hesap kapanışı & içerik akıbeti  ⟳ (KVKK 11.1-11.3; UX S9-S10)

- **⟳ İki adım:** (1) silme **talebi anında** ayrı yazma — `contactPhone/contactAddress = null`, `contactVisible = false`, profil `noindex` + gizle, `visibilityState` düşür. (2) Nihai anonimleştirme `$transaction`'ı (mevcut 30 gün SLA'lı akış) gerisini: `ExpertProfile → CLOSED`, `bio/headline/photoUrl = null` (`updateMany({where:{userId}})` array-form transaction'a eklenir).
- **⟳ S9/11.1:** DB null'lamak **Supabase Storage nesnesini silmez** — profil + işyeri fotoğrafı + kilitli arşiv belgesi **dosya olarak da kalıcı silinir**, imha kaydına yazılır.
- **⟳ 11.2 uydu tablolar:** `ConsentLog` **korunur [10 yıl]** (rıza + geri çekme ispat yükü); `ExpertScoreSnapshot` + `ExpertContactEvent` silinir/anonimleştirilir; `ExpertNoteVersion` nota bağlı; doğrulama özeti [10 yıl] sonra imha.
- **⟳ 11.3:** `PUBLISHED` notlar **takma adla** kalır (isim `User` üzerinden zaten anonim → "Silinmiş Kullanıcı"; "Silinmiş **Usta**" istenirse ayrı gösterim yolu, `User.displayName` yeniden kullanılmaz). Kalan notlar **doğrudan/dolaylı tanımlayıcılardan** ("benim dükkanım", işletme adı, artık telefon) **arındırılır**. Usta kapanışta **notlarının da silinmesini talep edebilir**.
- **⟳ Hukuki sebep:** not içeriğinin saklanması **açık rızaya değil, meşru menfaate (m.5/2-f — topluluk bilgi arşivi bütünlüğü) / sözleşmeye** dayandırılır; iletişim PII'si açık rızaya bağlı kalır, geri çekmede/kapanışta silinir.
- **İhlalle ban** (`SUSPENDED → CLOSED`): notlar `status = HIDDEN + removedAt` (**hard-delete yok** — RESTRICT FK).

---

## 12. Monetizasyon — mimari hazırlık (ilan YOK)  ⟳

- **⟳ R1:** `ExpertSponsorship` tablosu bugünden (UI/admin yok). `ExpertProfile.sponsoredUntilCache` yalnız denormalize cache.
- **⟳ R2:** `PlacementReason { EARNED, SPONSORED, EDITORIAL_PICK }`. Tüm yüzeye çıkarma **tek `getExpertPlacements(model, userRegion) → Placement[]`** arayüzünden geçer; bugün yalnız `EARNED` dalı — ama çağıran bu arayüzden geçsin (Faz 2 = branch eklemek).
- **⟳ R5:** `sponsorshipLive` computed guard, tek yerde: `status=ACTIVE && endsAt>now && profile.status=ACTIVE && visibilityState≠PAUSED && çözülmemiş haklı şikâyet yok`.
- **⟳ R6 / §18:** config sabitleri:
  - `MIN_EARNED_FEATURED_PEERS_FOR_SPONSORSHIP = 8` — **birim: bölge × geniş kategori** (ör. "İzmir + otomobil"), model değil. peers = `PlacementReason=EARNED` + şu an `FEATURED` + çözülmemiş haklı şikâyet yok. **[Kurucu kararı:** birim bölge×model mi bölge×kategori mi — kategori öneriliyor.**]**
  - `MAX_SPONSORED_SHARE = %25` + ek kurallar: liste < 8 öğe → **en fazla 1** sponsorlu (8-11 öğe → max 2); **1. sıra asla sponsorlu**; **yan yana iki sponsorlu yok**.
- **⟳ R3/R4:** `ExpertContactEvent` enum + `surface` + `placementReason` + `regionBucket` (ilçe granülerliği!) + `dedupeKey`; `MESSAGE_REPLIED` + `THREAD_REACHED_DEPTH_3` emit noktaları (mesajlaşma katmanında).
- **⟳ R-ek:** `ExpertRegionStat` aylık rollup (barem cron yazar).
- **⟳ R8:** `ConsentType += EXPERT_PERFORMANCE_ANALYTICS` bugünden (özellik kapalı) — erken ustalar baştan onaylasın.
- **⟳ R9 / marka S12.1:** İleride ücretli yüzey çıkarsa **açık, düz kelimeyle** ("Reklam / Sponsorlu") etiketlenir; editoryal + hak-edilen görünürlükten **görsel duvarla** ayrık; **§14.8 kelime yasağı yalnız o tek etiketli yüzey için, yalnız dürüst etiketleme yönünde kalkar**. Çıkmazsa bu satır silinir.
- **⟳ marka S12.2:** Dönüşüm ölçümü **yalnız ürün-sağlığı** için. "geçen ay size N iletişim" **B2B satış argümanı olarak kullanılmaz** — plandan çıkarıldı. Gelecekteki hiçbir sunum lead-sayısı çerçevesiyle yapılmaz.
- **Kırmızı çizgi:** para asla barem/rozet/not görünürlüğü/sıralamayı etkilemez; OEM parası usta katmanına girmez.

### ⟳ İlk ücretli teklif için tetikler (hepsi birlikte — monetizasyon ajanı)
≥ 40-50 aktif usta · aynı bölgede ≥ 8-10 `FEATURED` · ≥ 3 bölgede bu yoğunluk · platform geneli ≥ ~2.000 iletişim olayı/ay (veya tek bölge+model yüzeyi ≥ 300-500/ay), 3 ay sürdürülmüş · earned katmanı ≥ 6 ay temiz + ≥ 1 tam `FEATURED ⇄ PAUSED` döngüsü gözlenmiş · site iletişimlerinin > %30'u ustadan cevap alıyor (`MESSAGE_REPLIED`). **En erken gerçekçi ilk teklif: earned lansmanından ~9-12 ay sonra.**

---

## 13. Hukuki artefaktlar (lansman-öncesi ZORUNLU — avukat onayı şart)  ⟳

Bu turda taslakları yazıldı (→ **hukuki-metinler-v1.md**):
1. Usta Aydınlatma Metni ✅ taslak — **⟳** kısmen otomatik karar (barem) + KVKK m.11/1-g itiraz hakkı + m.9 aktarım mekanizması detayı dahil edildi
2. Usta Açık Rıza Metni (granüler, 3 kutu) ✅ taslak
3. Belge Saklama ve İmha Politikası ✅ taslak
4. Kullanıcıya Feragat / Sorumluluk Reddi (kısa + uzun) ✅ taslak
5. **Usta Katılım Koşulları** ✅ taslak (Trust ajanı) — **⟳** "tazminat yok" mutlak kaydı **TBK m.115** nedeniyle geçersiz → "**fikape'nin kasıt ve ağır ihmali saklı kalmak kaydıyla**..." biçiminde daraltıldı
6. **Üretici / 3. Kişi Bildirim-Kaldırma + Yanıt Hakkı Prosedürü** ✅ taslak + şema eki (UX ajanı)
7. **"Usta Görüşleri Nedir?" Açıklama Sayfası** ✅ tam metin (marka ajanı) + KULLAN/KULLANMA kelime tablosu

### ⟳ KVKK ajanının eklediği, lansmandan önce gerekli 8 kalem (metin değil, süreç):
1. **6563 sayılı ETK "aracı hizmet sağlayıcı" rol değerlendirmesi** — açık iletişim yayını + mesajlaşma + bölgesel öne çıkarma fikape'yi aracı konumuna taşıyabilir → ETBİS kaydı, ETK m.5 gösterim, şikâyet mekanizması yükümlülükleri. **Lansmandan önce yazılı hukuki görüş.**
2. **Yurtdışı veri işleyen sözleşmeleri (DPA)** — Supabase / Vercel / e-posta sağlayıcısı ile KVKK m.12 yazılı sözleşme + **m.9 aktarım mekanizması** (standart sözleşme / taahhütname) imzalanıp dosyalanır.
3. **VERBİS kaydı güncellemesi + Kişisel Veri İşleme Envanteri** — yeni kategoriler (belge, açık iletişim, konum), yeni amaçlar, yurtdışı aktarım.
4. **Kısmen otomatik karar (barem) itiraz + insan incelemesi prosedürü** (m.11/1-g) — §8 itiraz akışı bunun karşılığı olarak belgelenir.
5. **Reddedilen başvuru sahibinin belgelerinin imha kuralı** (§5.3'e işlendi).
6. **Storage nesnelerinin silinmesi** — DB null yeterli değil (§11'e işlendi).
7. **18 yaş / fiil ehliyeti kontrolü** başvuru akışında (§5.1'e işlendi).
8. **Açık iletişim yayını için yazılı risk/denge değerlendirmesi** (§7.4'e işlendi).

---

## 14. Kırmızı çizgiler  ⟳ (marka: 11 → 17)

1. Para (ustadan/markadan) not yerleşimini, rozeti, CV görünürlüğünü, bölgesel görünürlüğü **asla** etkilemez.
2. Editoryal içeriğin içinde/bitişiğinde "iletişime geç / teklif al / ara" CTA'sı **asla** — sadece `/usta/[slug]` profilinde.
3. Ustanın ticari durumu (barem, CV aktif/pasif) **onaylı editoryal içeriğin görünürlüğünü asla** değiştirmez.
4. Katalog / yorumlar / arama / sıralama usta görünürlüğüne bağlı hiçbir şeyle **asla** sıralanmaz.
5. Esnafın kişisel iletişim verisi **açık rıza + saklama politikası + çıkışta kalıcı silme (dosya dahil)** olmadan **asla** yayınlanmaz.
6. Servis/satışla geçinen kişinin araç değerlendirmesi, sahiplik yorumundan ayırt edilemez biçimde **asla** görünmez.
7. fikape'nin belirli bir ustayı iş için tavsiye ettiği **asla** ima edilmez. "Doğrulanmış" = "belge kontrol edildi".
8. Kullanıcıya dönük metinde "reklam / ilan / sponsor / tanıtım" kelimeleri **asla** — kelimeyi olumsuzlayarak da değil; ve bu kelimelerin tarif ettiği şeyi kurup etiketini gizlemek de **asla**. **⟳ İstisna:** ileride açık-etiketli ücretli yüzey çıkarsa, yalnız o yüzeyde, yalnız dürüst "Reklam/Sponsorlu" etiketi yönünde.
9. Usta ↔ kullanıcı arasında kullanıcının özel aracı hakkında **moderasyonsuz kanal asla** (Q&A = B modeli + `Answer.status`; mesajlaşma = filtreli).
10. Ustanın kendi sahiplik yorumları usta baremine **asla** sayılmaz.
11. Usta notu toplam FI·KA·PE skoruna veya yorum sayısına **asla** karışmaz.
12. **⟳** Ustanın sahiplik yorumundaki yazar satırı, usta profiline/iletişime **asla** derin link vermez — yalnız açıklama sayfasına giden bilgi rozeti.
13. **⟳** Telefon/açık adres; araç detay sayfasında, arama sonucunda, katalogda, bölgesel blokta **asla** gösterilmez. Yalnız `/usta/[slug]` profilinde, kullanıcının bilerek tıkladığı adımın ardında.
14. **⟳** Hiçbir editoryal yüzeyde (bölgesel blok dahil) usta, yazdığı nottan bağımsız bir "kart" olarak sunulmaz: her zaman önce katkı, sonra atıf.
15. **⟳** Bir modelde tek ustanın notu varsa o model için bölgesel blok **asla** açılmaz (≥ N bağımsız usta şartı sert kapı).
16. **⟳** Kullanıcıya giden bildirim/e-posta ustayı **asla** "deneyebileceğiniz bir hizmet" olarak sunmaz; yalnız içerik olayını haber verir.
17. **⟳** "tazminat yok" mutlak sorumsuzluk kaydı kullanılmaz; fikape'nin kasıt/ağır ihmali her hâlükârda saklıdır (TBK m.115).

---

## 15. Kabul edilen riskler  ⟳ (KVKK 15.1-15.3 ile güncellendi)

| Risk | Kaynak endişe | Alınan önlem |
|---|---|---|
| Faz ayrımı yok — hepsi birlikte | Tüm KVKK/sorumluluk/moderasyon yükü gelir sıfırken; solo moderasyon ilk aşınma noktası; dışarıdan "inceleme sitesi + esnaf rehberi" algısı tek seferde | §13 (7 metin + 8 süreç) lansman-öncesi zorunlu; §5.2 başvuru penceresi + kota + backpressure; §10 ölçek tavanı; §14 (17 çizgi) |
| Açık adres + telefon yayını | Scraping/spam mıknatısı; "fikape önerdi" sorumluluğu; deindeks yükü; **⟳** VERBİS/m.9/6563 ETK yükümlülükleri | Granüler açık rıza + il/ilçe zorunlu-adres opsiyonel + **⟳ geri çekmede derhal kaldırma** + noindex + sitemap çıkarımı + maskeli mesajlaşma alternatifi + **⟳ 18 yaş kontrolü** + **⟳ yazılı risk/denge değerlendirmesi** + feragat |
| Pilot yok, başvuru herkese açık | 1. günden sınırsız moderasyon; galerici/pazarlamacı sızması; **⟳** koordineli çok-cepheli başvuru | Admin onayı zorunlu + **⟳ ayın ilk 7 günü pencere + kademeli K (3→5→8) + WAITLISTED + kademeli backpressure** + beyan kutusu + **⟳ koordineli başvuru tespit panosu** + triaj |
| Barem formülü baştan | Yayınlanan formül = gaming tarifi; solo denetim zorluğu; **⟳** grace'te bedava FEATURED lead hasadı | Eşikler gizli + `ExpertOverrideEvent` kalibrasyon logu + histerezis (asimetrik) + **⟳ grace tanıtım yüzeyi açmaz** + Wilson + esir-kitle çarpan kapısı + **⟳ kısmen-otomatik-karar itiraz prosedürü (m.11/1-g)** |
| **⟳ İleride ustadan ücret** | "hiçbir zaman para karşılığı görünürlük yok" diyemiyoruz; daha zayıf vaat | `PlacementReason` ayrımı + `sponsorshipLive` guard + `MAX_SPONSORED_SHARE` + zorunlu açık etiket + editoryal duvar |

---

## 16. Yeni riskler & açık teknik konular  ⟳

- **Site Product-merkezli; Model sayfası/`categoryId` yok** → araç sayfası render'ında Model→Products fan-out; **⟳ yazma tarafında da** fan-out (revalidate, S6).
- **⟳ `ContentReport.productId` NOT NULL** → `EXPERT_NOTE` şikayeti açılamaz (nullable + XOR CHECK + admin UI dalı).
- **⟳ `Answer` moderasyon alanı yok** → not-altı Q&A §14.9'u ihlal eder (`Answer.status` + tüm sorgulara filtre — paylaşılan tabloya değişiklik).
- **⟳ Ban'de hard-delete** RESTRICT FK ile çakışır → `status=HIDDEN + removedAt`.
- **⟳ Hesap silme 30 gün SLA'lı** → yayınlanmış telefon/adres **talep anında** sıfırlanır.
- **⟳ Storage nesneleri** DB null ile silinmez → dosya silme + imha kaydı.
- **⟳ "Silinmiş Usta" `displayName`'den türetilemez** ("Silinmiş Kullanıcı" yazılıyor).
- **⟳ `qualityScore` mutable** → `approvedQualityScore` (onay anı) barem girdisi; edit → PENDING + dondur.
- **noindex flip-flop** → asimetrik histerezis (FEATURED ≥0.55×2ay, PAUSED <0.40×2ay).
- `prisma migrate` kırık → elle SQL, enum ALTER eksiksiz.
- CV slug rename → dondur + 301.
- `SUSPENDED` vs `PAUSED` vs `PROBATION` → UI + cron net ayrım; cron `SUSPENDED`'a dokunmaz, geri alırken `HIDDEN`'a çeker.
- **⟳ Efor ~10-12 hafta** (maskeli mesajlaşma + itiraz akışı + şema değişiklikleri + cache invalidation ayrı kalemler). **Kurucu kararı: tek teslim.**
- **⟳ Butik vs ölçek — KARAR VERİLDİ:** usta sayısının **büyümesine izin verilir**, kalıcı tavan felsefesi yok. §5.2'deki başvuru penceresi + kademeli K + backpressure **operasyonel güvenlik valfi** olarak kalır (moderasyon boğulmasını önler), kalıcı sınır değil. Sıkıntı doğarsa (ör. 2. moderatör ihtiyacı) yeniden bakılır.

---

## 17. İş kırılımı & efor  ⟳ (~10-12 hafta, tek teslim)

| Blok | ⟳ Not | Efor |
|---|---|---|
| Şema + SQL | 6 çekirdek + sponsorship + region stat + takedown + Question/Answer/ContentReport/ConsentLog değişiklikleri + enum'lar | ~2 gün |
| İçerik katmanı | `/usta-gorusu/yaz` · model seçici · `structured` · araç sayfası tab (TabView union + deep-link + revalidate fan-out) · not kartı · rozet | ~5-6 gün |
| Moderasyon | admin kuyruğu · triaj · `approvedQualityScore` akışı · bildirimler · içerik filtresi surface · `ContentReport` EXPERT_NOTE dalı · koordineli başvuru panosu | ~4-5 gün |
| Oylar + Q&A | `ExpertNoteVote` · not-altı Q&A (`expertNoteId` + `Answer.status` + tüm çağrı yerleri) · kendi notuna engel | ~3 gün |
| Usta profili | `/usta/[slug]` · CV editörü · başvuru formu (pencere/kota/WAITLISTED) + admin inceleme · slug dondurma/301 · JSON-LD | ~5-6 gün |
| İletişim | granüler rıza + `ConsentLog.consentVersion` + aydınlatma + **maskeli mesajlaşma (MessageThread deseni — ayrı kalem)** + self-servis kaldırma + hesap silme 2-adım entegrasyon | ~6-8 gün |
| Barem | `ExpertScoreSnapshot` + `ExpertOverrideEvent` + `/api/cron/expert-standing` + `vercel.json` · formül (Wilson, çarpan kapısı, asimetrik histerezis, grace) · PAUSED/PROBATION etkileri + bildirim/e-posta · admin override UI | ~5-6 gün |
| **İtiraz akışı (ayrı kalem)** | model + admin kuyruğu + 2/30gün limit + 14 gün auto-final + bildirimler | ~2 gün |
| Bölgesel | `regionBucket` (ilçe) bağlamsal sor · araç sayfası bölgesel blok (not-birincil) + fallback · ≥N usta + tek-usta kapısı | ~3 gün |
| Dönüşüm ölçümü | `ExpertContactEvent` (enum/surface/dedupe) emit noktaları + `ExpertRegionStat` cron rollup | ~2 gün |
| Oy sahteciliği işi | gecelik job · `voteConfidence` | ~2 gün |
| Takedown | `ExpertNoteTakedownRequest` + `ExpertNoteExternalReply` + admin akışı + 72s geçici gizleme + yanıt bloğu render | ~4-5 gün |
| **Toplam** | | **~10-12 hafta odaklı solo iş** |

---

## 18. Mini kararlar — KAPATILDI (§18 ajanı)

| Konu | Karar |
|---|---|
| Kota K | Ay 1-2: **3** · Ay 3-6: **5** · Ay 6+: koşullu +1/pencere, tavan **8** (§5.2) |
| Backpressure | Yumuşak 15 kuyruk / 3 gün → K yarılanır · Sert 25 / 4 gün → pencere atlanır, K=3 sıfırlanır (§5.2) |
| Bölgesel gösterim | **İl** düzeyi; ilçe yalnız profil sayfasında (§9) |
| Blok açılış eşiği | **≥ 3 farklı usta** + ≥2'sinde `approvedQualityScore ≥ 1` + son 365g'de ≥1 not; sert kapı (§9) |
| `MIN_EARNED_FEATURED_PEERS` | **8**, birim bölge × kategori (§12) |
| `MAX_SPONSORED_SHARE` | **%25** + liste<8→max 1 · 1. sıra asla · bitişik yok (§12) |
| Oto-yayın | **N=20** + kapılar; **ilk teslim DIŞI**, sonraki iterasyon (§10) |
| Not-altı cevap barem ağırlığı | **Sıfır** — yalnız aktiflik kapısı (§8) |
| Grid kartı rozeti | **Eklenmez**; %40 kapsama tetiğinde bakılır (§6) |
| Butik vs ölçek | Büyümeye izin verilir (§16) |

**Kurucu kararına işaretli (sonra, veriye bağlı):**
- İstanbul yaka-düzeyi (Anadolu/Avrupa) opt-in filtre — gerçek yoğunluk oluşunca.
- Sponsorluk birimi bölge×model mi bölge×kategori mi — kategori öneriliyor.
- Q&A cevap teşviki (+0.02 tavanlı) — davranış verisi görülünce.
- Grid rozeti yeniden değerlendirme (%40 kapsama).

---

## 19. Sıradaki adım

1. Bu v2'yi ve hukuki taslakları gözden geçir.
2. §18'deki mini kararlar + §16'daki **butik/ölçek** yön kararı.
3. Onay sonrası: kararlar memory'ye işlenir, uygulama SQL şemasıyla başlar.
4. Lansmandan önce §13'teki 7 metin avukata + 8 süreç kalemi (özellikle 6563 ETK) tamamlanır.
