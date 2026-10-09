# E-bisiklet teknik özellik araştırması — 2026-10-09

Kural: Marka + Model + Model yılı kayıtla uyuşmayan kaynak kullanılmadı. Kaynağın yılı farklıysa veri girilmedi, kayıt "sorunlu" listesine alındı.
Kaynak katmanları: (1) model yılı belirtilen kaynak (Epey, yıl alanı kayıtla aynı) · (2) resmi üretici/tedarikçi sayfası (güncel katalog; yıl belirtmiyor → kayıt notu).
Yalnızca kaynakta yazan değerler girildi; Wh = V × Ah yalnız V ve Ah kaynakta varsa hesaplandı (not: Ape Ryder 720 Wh, Kuba Speedlight Pro 280,8 Wh, Volta VB1 Neo 280,8 Wh, Volta VB7 888 Wh).

## Doldurulan / güncellenen kayıtlar

| Kayıt | Kaynak | Not |
|---|---|---|
| Ape Ryder MD-10 Pro 2025 | Epey (Model Yılı 2025) | +11 alan; resmi site model sayfası ana sayfaya yönleniyor |
| Kuba Speedlight Pro 2024 | Epey (Model Yılı 2024) | +12 alan |
| Corelli Voniq Eco 2024 (2025→2024, Epey) | corelli.com.tr/…/voniq-eco-203 | +22 alan; resmi sayfa yıl belirtmiyor (Epey: 2024) |
| Carraro E-Flexi Nexus 2022 (2025→2022, Epey) | carrarobisiklet.com/…/e-flexi-20-nex-8v-hd | +16 alan; resmi sayfa yıl belirtmiyor (Epey: 2022; 2020 sürümü ayrı sayfa) |
| RKS XS25 2023 | Epey (Model Yılı 2023) + satıcı ilanı | +2 alan; vites 6→7, fren "Disk Fren"→"Mekanik disk" güncellendi |
| Volta VB1 Neo 2026 | A101 (tedarikçi bilgisi) | +9 alan |
| Volta VB1 2026 | A101/Trendyol/Hepsiburada ilanları | bike_type şehir→katlanabilir |
| Volta VB2 2026 | A101 "VB2 Alüminyum Katlanır" (48V 10Ah varyantı) | +11 alan; bike_type şehir→katlanabilir |
| Volta VB2 Pro 2026 | A101 + Migros | +5 alan |
| Volta VB3 2026 | A101 | +1 alan (24 kg) |
| Volta VB5 2026 | A101 + Hepsiburada | +3 alan |
| Volta VB7 2026 | A101 (Epey ile batarya/fren tutarlı) | +15 alan |
| Trek Allant+ 7 Stagger 2023 | 99spokes (arama alıntısı; sayfa bot doğrulaması istedi, atlanmadı) | +1 alan (fren) — adı doğru: Trek'te "7" ve "7S Stagger" ayrı modeller |

## Sorunlu kayıtlar (veri girilmedi)

Model bulunamadı:
- Salcano E-Bike EX1 2022 (Salcano resmi sitesinde EX1 yok)
- Strada Mobility E-City 2025 (stradamobility.com'da E-City yok; E-Lite vb. var)
- Corelli E-City 2024 (corelli.com.tr'de E-City yok)
- Carraro E-Folding 2024 (Carraro'da E-Flexi/Flexi/E-Line var, E-Folding yok; "E-Folding" Bisan'a ait)
- Skyjet XS25 2023 (Skyjet S25 ve RKS XS25 var; "Skyjet XS25" yok)

Model var, yıl/varyant doğrulanamadı:
- Kuba Speedlight 2020 (Epey: 2022; 2020 için kaynak yok)
- Roxform R-300 2023 (roxformshop: 13/15/20 Ah seçenekli, yıl belirtmiyor)
- Bisan E-Folding F3 2026 (Epey: 2025; değerler kayıtla tutarlı)
- Skyjet Nitro Pro 2025 (Epey: 2024)
- RKS RSI-X-PRO 2026 (Epey: 2020 eski nesil, çelik kadro)
- RKS MX25 Pro / XS35 / RD8 / NERO-M 2026 (Epey eski yıllar; bikerks.com bu ortamdan açılmadı)
- Volta VB1 2026 (satıcılar arasında 7,8 / 8,8 Ah, 6/7 vites çelişkisi)

Kaynak çelişkisi (kayıt değiştirilmedi):
- Volta VB5: A101 36 V 13,5 Ah (486 Wh) — kayıt 10 Ah (360 Wh)
- Volta VB2 Pro: menzil A101 50–80 km, Migros tablosu 30–55 km — kayıt 55
- Volta VB3: şarj A101 5–6 sa — kayıt 5

Erişilemeyen kaynaklar: voltafabrikasi.com (522), bikerks.com, dsmotor.com.tr, aperyder.com.tr model sayfası (ana sayfaya yönleniyor), 99spokes.com (bot doğrulaması).
