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

- [ ] **Takasta karşılıklı onayla telefon paylaşımı** — Takas mesajlarında telefon/e-posta/WhatsApp filtreli (`checkContent` strict) ve ilan sayfasında iletişim butonu yok; anlaşan taraflar numara iletemiyor (filtre dolanılıyor ya da takas yarıda kalıyor). Öneri: görüşmede iki tarafın da "Telefon numaramı paylaş" demesiyle numaraların karşılıklı görünmesi; onay `ConsentLog`'a yazılır (TRADE_LISTING benzeri), mesaj filtresi değişmez. Henüz karar yok, yalnız not.

## Tamamlandı
