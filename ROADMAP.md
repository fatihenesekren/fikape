# fikape — Yol Haritası

## Vizyon

**fi·ka·pe = FI**yat · **KA**lite · **PE**rformans

Türkiye'deki araç sahiplerinin gerçek deneyimlerini paylaştığı platform.
Sahibinden.com fiyat verir, Arabam.com teknik özellik verir — fikape "3 yıl kullandım, gerçek izlenim şu" der.

Referans model: [TrueDelta](https://truedelta.com) — tek kişi yönetiyor, 103.000+ kullanıcı, 2007'den beri.

---

## Teknoloji Yığını

| Katman | Teknoloji | Notlar |
|---|---|---|
| Frontend | Next.js 16.2.9 (App Router, Turbopack) | SSR zorunlu — SEO kritik |
| Stil | Tailwind CSS v4 | Mobile-first |
| Dil | TypeScript (strict) | |
| ORM | Prisma 7.8.0 + `@prisma/adapter-pg` | Adapter pattern — datasource'da `url` yok |
| Veritabanı | PostgreSQL (Supabase) | pgbouncer :6543 (app), :5432 (migration) |
| Auth | NextAuth v5 (beta.31) + bcryptjs (cost 12) | |
| Deploy | Vercel (frontend) + Supabase (DB) | |
| Görsel | Wikipedia REST API → DB'ye seed | Yeni araç: `npx tsx scripts/seed-images.ts` |

---

## Renkler & Formül

```
FI (Fiyat)      → #0C447C  bg: #E6F1FB  ağırlık: 0.30
KA (Kalite)     → #27500A  bg: #EAF3DE  ağırlık: 0.35
PE (Performans) → #712B13  bg: #FAECE7  ağırlık: 0.35

scoreOverall = scoreFiyat×0.30 + scoreKalite×0.35 + scorePerformans×0.35
Puan aralığı: 1–10
```

---

## Fazlar

### Faz 1 — MVP (Şu an)
- [x] Araç katalogu (marka → model → ürün hiyerarşisi)
- [x] Anasayfa: model kartları, yakıt filtresi, CTA banner
- [x] Araç detay sayfası
- [x] Kullanıcı kayıt / giriş (NextAuth v5 Credentials)
- [x] Yorum yazma formu (FI·KA·PE scorer 1–10, ek bilgiler)
- [x] Katman 1 moderasyon (kural tabanlı)
- [ ] Araç öneri akışı (listede olmayan araçlar)
- [ ] AI moderasyon — Katman 2 (Claude Haiku, asenkron)
- [ ] Vercel deploy + env vars

### Faz 2 — Büyüme
- [ ] E-posta doğrulama (trustLevel 1→2)
- [ ] Garaj ("Bu araç benim" — kullanıcı-ürün ilişkisi)
- [ ] Yorum detay sayfası
- [ ] "Faydalı" oylama sistemi
- [ ] Yorum güncelleme (3 ayda bir hatırlatma — TrueDelta modeli)
- [ ] Admin moderasyon paneli
- [ ] SEO: sitemap, metadata, structured data

### Faz 3 — Ölçekleme
- [ ] Doğrulanmış sahip rozeti (fotoğraf/sigorta ile)
- [ ] Kategori genişlemesi (motosiklet, elektrikli scooter)
- [ ] Kullanım tipi bazlı filtreleme (şehir içi / şehirlerarası)
- [ ] Affiliate entegrasyonu (sigorta, ikinci el)
- [ ] Mobil uygulama (React Native)

---

## Riskler

| Risk | Çözüm |
|---|---|
| Cold start (yorum yok → okuyucu yok) | Facebook grupları / Donanım Haber ile ilk kullanıcı edinimi |
| Fake review / bayi manipülasyonu | Katmanlı moderasyon + IP anomali tespiti |
| KVKK | Belge saklanmaz, sadece hash/sonuç tutulur; consent log var |
| Tek kişi yükü | Otomasyon önce; topluluk moderasyonu sonra |

---

## Gelir Modeli (Öncelik Sırası)

1. Affiliate — sigorta, ikinci el satış yönlendirmesi
2. Öne çıkarma — bayilerden sponsorlu içerik
3. Display reklam — yüksek trafik sonrası
4. Agregat veri satışı — üreticilere/sigortalara (uzun vade)
