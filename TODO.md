# fikape — Yapılacaklar Listesi

> Öncelik sırası: yukarıdan aşağıya. Tamamlananlar en alta taşınır.

---

## 🔴 Kritik / Sıradaki

### Araç Öneri Akışı
Listede olmayan araç için kullanıcı akışı.
- Yorum yazma formuna "Aradığınız araç listede yok mu? Önerin →" linki
- `src/app/araç-oner/page.tsx` — marka / model / yıl / trim formu
- `src/app/api/vehicle-suggestions/route.ts` — PENDING olarak DB'ye düşer
- Admin onaylayınca `isActive: true` → yorum yazılabilir hale gelir
- DB: mevcut `products` tablosuna `status: PENDING | ACTIVE` mantığı veya ayrı `vehicle_suggestions` tablosu

### AI Moderasyon — Katman 2
Kural tabanlı Katman 1 geçtikten sonra asenkron Claude kontrolü.
- `src/app/api/reviews/moderate/route.ts` — POST review sonrası tetiklenir
- Claude Haiku: "Bu araç yorumu mu? Hakaret var mı? Alakalı mı?"
- Sonuç → `PUBLISHED` veya `REJECTED` + red sebebi
- Rejected kullanıcıya bildirim (e-posta veya sayfa mesajı)
- Model: `claude-haiku-4-5-20251001`

### Vercel Deploy
- Vercel'de proje oluştur, GitHub reposunu bağla
- Env vars ekle: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`
- `next.config.ts`'e Wikimedia domain'i whitelist'e al (veya `<img>` kullanımına devam)

---

## 🟡 Önemli / Yakın Vadeli

### Yorum Gönderildi Sayfası
`/araclar/[slug]?yorum=gonderildi` parametresini yakalayıp başarı mesajı göster.

### Araç Detay Sayfası — Yorum Listesi
Şu an yorum yoksa boş sayfa. Yayındaki yorumlar (`status: PUBLISHED`) listelenmeli.
- Ortalama FI·KA·PE puanları (bar chart)
- Yorum kartları: kullanıcı adı, tarih, özet, detay, ek bilgiler
- "Faydalı" butonu

### E-posta Doğrulama
Kayıt sonrası doğrulama maili → `trustLevel` 1→2.
- Resend veya Nodemailer
- Token tabanlı doğrulama linki

### Admin Moderasyon Paneli
Basit liste: PENDING yorumlar → Onayla / Reddet.
- `/admin/yorumlar` — session'da trustLevel kontrolü (≥ 5 gibi bir admin seviyesi)

---

## 🟢 Uzun Vade / Faz 2-3

- Garaj sistemi: "Bu araç benim" → `UserProduct` tablosu zaten hazır
- Doğrulanmış sahip rozeti (fotoğraf / sigorta belgesi hash)
- Yorum güncelleme hatırlatması (3 ayda bir)
- "Faydalı" oylama (`ReviewHelpfulVote` tablosu hazır)
- Kullanım tipine göre filtreleme (şehir içi vs şehirlerarası)
- SEO: sitemap.xml, robots.txt, JSON-LD structured data
- Kategori genişlemesi (motosiklet, scooter)
- Affiliate entegrasyonu
- Mobil uygulama (React Native)

---

## ✅ Tamamlananlar

- [x] Prisma şeması — evrensel kategori sistemi, KVKK tabloları
- [x] Supabase PostgreSQL bağlantısı (adapter pattern)
- [x] Seed data — 6 model, 13 araç varyantı
- [x] Anasayfa — model kartları, model gruplama, ağırlıklı ortalama puan
- [x] Wikipedia araç görselleri (`vehicleImages.ts`) → DB'ye seed script
- [x] Yakıt tipi filtresi (Tümü / Elektrikli / Hibrit / Benzin / Dizel)
- [x] VehicleCard — primary/secondary variant chip, yakıt ikonu, kasa tipi badge
- [x] CTA banner (anasayfa alt)
- [x] Footer sadeleştirme
- [x] Araç detay sayfası (`/araclar/[slug]`)
- [x] NextAuth v5 Credentials — kayıt, giriş, oturum
- [x] AuthNav — header'da oturum durumuna göre butonlar
- [x] Route koruması (`proxy.ts` — `/yorum-yaz` için)
- [x] Yorum yazma formu — FI·KA·PE scorer 1–10, segment track UI
- [x] Genel puan göstergesi — büyük skor kartı, renk skalası
- [x] Araç seçiminde mini kart (fotoğraf + badge)
- [x] Katman 1 moderasyon — min uzunluk, URL, spam, küfür listesi
- [x] Ek Bilgiler yeniden tasarımı — tavsiye, sahiplik süresi, kullanım tipi
- [x] `src/lib/fikape.ts` — FikapeScores, FIKAPE sabiti, calcOverall
- [x] `src/lib/reviewValidation.ts` — kural tabanlı içerik denetimi
- [x] `scripts/seed-images.ts` — Wikipedia URL'lerini DB'ye yazar
