# TODO

## Aktif Görev: vehicles.json + oner form güncelleme

- [x] 1. vehicles.json otomobil (39 marka, yeni yapı)
- [x] 2. vehicles.json motosiklet (25 marka)
- [x] 3. vehicles.json kamyonet (20 marka)
- [x] 4. vehicles.json e-scooter (15 marka)
- [x] 5. vehicles.json karavan (24 marka)
- [x] 6. oner/page.tsx version + trim dropdown (5 seviyeli seçim)
- [x] 7. Commit + push — 631e65f

## Backlog — İleride Değerlendirilecek

- [ ] **Çok dilli destek (TR/EN)** — Site TR + EN olarak erişilebilir olsun. Statik arayüz metinleri (next-intl, `/tr` `/en` routing) + sabit içerik (chip etiketleri, marka/model adları) önceden çevrilir. Kullanıcı yorumları (serbest metin) için on-demand makine çevirisi (DeepL/Google Translate API) + DB cache (`ReviewTranslation` tablosu) + "Makine çevirisi" rozeti/uyarısı (kullanıcının sözünü yanlış temsil etmeme). Efor: ~1-2 hafta solo. Henüz kesin karar yok, ileride tekrar değerlendirilecek.

- [ ] **Anonim yorum API'si (3. şirketlere, ileride ücretli olabilir)** — Yalnız yorum metni + puanlar + araç + tarih; kullanıcı adı/e-posta/kimlik/fotoğraf YOK. Yorum formuna ek not eklenmeyecek. Önce hukuki zemin: Üyelik Sözleşmesi m.6 + Kullanım Koşulları m.6 lisansı API ile sunumu kapsamıyor, Gizlilik Politikası "üçüncü taraflara satılmaz" cümlesi çelişiyor (metinler henüz DEĞİŞTİRİLMEDİ; avukat kontrolü gerekli). Teknik: kimlik alanı yok + yorum için rastgele dış kimlik, yalnız yayındaki yorumlar, silme yansıması (webhook/silinenler listesi), çıktı maskeleme (telefon/e-posta/plaka/URL), plaka kuralı `reviewValidation.ts`'e, API kullanım sözleşmesi, şirket/fatura yapısı. Aşama: önce ücretsiz agrega puan kartı, sonra metinli/ücretli. Ayrıntı: hafızada `backlog_yorum_api_anonim_ucuncu_taraf`.

- [x] **Takasta karşılıklı onayla telefon paylaşımı** — YAPILDI (2026-10-14): görüşmede karşılıklı paylaşım, şifreli ThreadPhoneShare, rıza ConsentLog TRADE_PHONE_SHARE (context thread:ID), kapat/engelle/hesap silme anında, cron 30 gün. SQL: prisma/migrations/add_thread_phone_share.sql. Açık: PHONE_SHARE_KEY env (yoksa AUTH_SECRET türevi), SMS doğrulaması yok (bilinçli), metinler avukat kontrolü.

- [ ] **Ticari kazanç başlamadan önce yapılacaklar (hukuki/şirket)** — şirket yok, ticari gelir yok (2026-10-14 kararı: hepsi ticari başlangıçtan önce). Sıra: (1) şirket kurulumu (şahıs/limited, mali müşavir, vergi/fatura); (2) Gizlilik m.1 veri sorumlusu kimliği: unvan/ad-soyad, adres, KEP, MERSİS — şu an yalnız "fikape.com'u işleten gerçek kişi" + info@ (kullanıcı adını yazmak istemedi); VERBİS muafiyeti teyidi; (3) yurt dışı aktarım dayanağı: sağlayıcı DPA'ları (Supabase AB/İrlanda eu-west-1, Vercel, Resend, Google, Tavily), standart sözleşme + Kurul bildirimi; (4) iş ortağı türü/amacı metne + kayıt kutusuna, rıza yenileme (şu an metinler "şu an paylaşım yapılmıyor, başlamadan önce bilgilendirilecek" diyor); (5) API kullanım sözleşmesi (silme süresi: örn. 7 gün talep / 30 gün uygulama, yeniden satış-kazıma yasağı); (6) tüm metinler için avukat teyidi. Ayrıntı: hafızada `backlog_yorum_api_anonim_ucuncu_taraf`.

## Tamamlandı
