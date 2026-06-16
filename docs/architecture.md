# fikape — Mimari Kılavuz

## Dizin Yapısı

```
src/
├── app/
│   ├── page.tsx                  # Anasayfa (server component)
│   ├── layout.tsx                # Root layout, SessionProvider, AuthNav
│   ├── araclar/[slug]/page.tsx   # Araç detay sayfası
│   ├── giris/page.tsx            # Giriş sayfası
│   ├── kayit/page.tsx            # Kayıt sayfası
│   ├── yorum-yaz/
│   │   ├── page.tsx              # Server component — session + DB fetch
│   │   └── ReviewForm.tsx        # Client component — form UI
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── auth/register/route.ts
│       └── reviews/route.ts
├── components/
│   ├── AuthNav.tsx               # Header auth butonları (client)
│   ├── FikapeScore.tsx           # Puan gösterimi (chips / bars)
│   ├── SessionProvider.tsx       # NextAuth SessionProvider wrapper
│   └── VehicleCard.tsx           # Model kartı
├── lib/
│   ├── prisma.ts                 # Prisma client (adapter pattern)
│   ├── fikape.ts                 # FikapeScores tipi, FIKAPE sabiti, calcOverall
│   ├── reviewValidation.ts       # Katman 1 içerik denetimi
│   └── vehicleImages.ts          # Wikipedia thumbnail fetch
├── auth.ts                       # NextAuth config
├── proxy.ts                      # Route koruması (middleware.ts yerine)
├── generated/prisma/             # Prisma generated client
└── types/
    └── next-auth.d.ts            # Session type augmentation

prisma/
└── schema.prisma                 # Tek kaynak

scripts/
└── seed-images.ts                # Wikipedia URL'lerini DB'ye yazar
```

---

## Veritabanı

### Bağlantı (KRİTİK)
```
DATABASE_URL  → port 6543  (pgbouncer — uygulama)
DIRECT_URL    → port 5432  (doğrudan — sadece migration)
```

Prisma 7 adapter pattern — datasource'da `url` alanı **yok**:
```ts
new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})
```

### Temel Hiyerarşi
```
Brand → Model → Product (araç varyantı)
                   ↓
              UserProduct (garaj)
                   ↓
               Review (yorum)
```

### Product.attributes (JSON)
Araç varyantına özgü alanlar:
```json
{
  "fuel_type": "EV | HYBRID | GASOLINE | DIESEL | LPG",
  "body_type": "suv | sedan | hatchback | mpv | pickup | coupe",
  "segment":   "A | B | C | D",
  "year":      2024
}
```

### Review.extendedData (JSON)
Kategoriye özgü ek veriler:
```json
{
  "usage_type": "city | highway | mixed"
}
```

### Review Durumu Akışı
```
Kullanıcı gönder → PENDING → [Katman 1: kural] → [Katman 2: Claude AI] → PUBLISHED | REJECTED
```

### Trust Level (Kullanıcı)
```
0 = Anonim
1 = E-posta kayıtlı (varsayılan)
2 = E-posta doğrulamalı
3 = Beyan edilen araç sahibi
4 = Doğrulanmış araç sahibi (belge hash)
5+ = Admin
```

---

## FI·KA·PE Formülü

```
scoreOverall = scoreFiyat × 0.30
             + scoreKalite × 0.35
             + scorePerformans × 0.35

Puan aralığı: 1–10 (Float, DB'de Float tipinde)
```

Puan renk skalası (UI):
```
≥ 9.0  → yeşil  (#14532d / #dcfce7)
≥ 7.0  → mavi   (#0C447C / #dbeafe)
≥ 5.0  → turuncu (#9a3412 / #ffedd5)
< 5.0  → kırmızı (#991b1b / #fee2e2)
```

---

## Auth Sistemi

- **NextAuth v5** (`next-auth@beta.31`) — Credentials provider
- **bcryptjs** — şifre hash (cost factor 12)
- **`src/auth.ts`** — `handlers`, `auth`, `signIn`, `signOut` export
- **`src/proxy.ts`** — Next.js 16'da `middleware.ts` yerine kullanılır
- **Session'da ekstra alanlar** (`src/types/next-auth.d.ts`):
  ```ts
  session.user.id         // DB user id (string)
  session.user.trustLevel // 1–5+
  ```

---

## Görsel Sistemi

1. `product.imageUrl` DB'de doluysa → direkt kullan
2. Boşsa → `src/lib/vehicleImages.ts` üzerinden Wikipedia'dan çek

**Yeni araç eklendiğinde:**
```bash
npx tsx scripts/seed-images.ts
```

Wikipedia eşleşmesi `src/lib/vehicleImages.ts` içindeki `WIKI_PAGE` sözlüğünden gelir:
```ts
"fiat-egea": "Fiat_Egea"   // slug prefix → Wikipedia sayfa adı
```

**Önemli:** Wikimedia görselleri için Next.js `<Image>` değil düz `<img>` kullan.
Next.js image proxy Wikimedia CDN'den 400 döndürür.

---

## Katman 1 Moderasyon (`src/lib/reviewValidation.ts`)

Her yorum gönderiminde hem client hem server'da çalışır:

| Kural | Özet | Detay |
|---|---|---|
| Min uzunluk | 20 karakter | 50 karakter |
| Max uzunluk | 500 karakter | — |
| URL yasağı | `http://`, `www.` | aynı |
| Spam | aynı harf 10+, kısa blok tekrarı | aynı |
| Harf oranı | %40 altı → geçersiz | aynı |
| Küfür listesi | Türkçe blacklist | aynı |

---

## Önemli Kararlar & Gerekçeler

| Karar | Gerekçe |
|---|---|
| `proxy.ts` (middleware değil) | Next.js 16 `middleware.ts`'i deprecated etti |
| Adapter pattern (url yok datasource'da) | Prisma 7 zorunluluğu |
| pgbouncer :6543 app / :5432 migration | Supabase connection pooling |
| `<img>` (Next Image değil) | Wikimedia CDN proxy hatası |
| SCORE aralığı 1–10 | Daha hassas ayrım, kullanıcı için daha anlamlı |
| `status: "PENDING"` default | Tüm yorumlar moderasyona düşer |
| `extendedData` JSON alanı | Kategori bazlı esneklik, migration gerektirmez |
