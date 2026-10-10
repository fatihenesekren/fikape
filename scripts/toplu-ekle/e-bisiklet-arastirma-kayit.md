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

## 2. tur — yıl kararları (aynı gün)
- Kuba Speedlight 2020 → **2022** (Epey Model Yılı 2022); +11 alan; görsel yeni adrese taşındı.
- Bisan E-Folding F3 2026 → **2025** (Epey Model Yılı 2025); +2 alan (menzil 60 km, şarj 6 sa).
- Roxform R-300 2023 — yıl korundu (resmi mağaza sayfası yıl belirtmiyor, çelişen kaynak yok); +16 alan (pil/menzil varyanta bağlı olduğundan girilmedi: 13/15/20 Ah).
- Skyjet Nitro Pro 2025 — korundu (kayıttaki kullanıcı tablosu "üretici 2025 model" diyor; Epey 2024).
- RKS RSI-X-PRO / MX25 Pro / XS35 / RD8 / NERO-M 2026 — korundu (kullanıcı tablosu: üretici 2026 ürün gamı; Epey eski nesil/yıl).
- Volta VB1 2026 — veri girilmedi: Trendyol VB1 adresi VB1 Neo'ya yönleniyor, Hepsiburada listesinde VB1 yok (güncel katalogda düz VB1 görünmüyor olabilir).
- Model resmi listelerde yok (kayıtlar silinmedi, görselleri var): Salcano E-Bike EX1, Strada Mobility E-City (Strada: E-Lite), Corelli E-City, Carraro E-Folding, Skyjet XS25.

## 3. tur — Carraro E-Flexi Nexus → E-Time Easy (aynı gün, kullanıcı kararı)
Kayıt (id 1051) **Carraro E-Time Easy 2022** olarak yeniden adlandırıldı (kaynak: kullanıcı tablosu "E-Time Easy 28 9-V HD, 2022"). Önceki öznitelikler (E-Flexi 20" verisi) tamamen kaldırıldı; yeni tablodan 20 alan girildi (28" şehir/tur, Shimano STEPS E5000 orta motor, 418 Wh, Alivio 1x9, MT200 hidrolik disk, Suntour NEX E-25 maşa). Menzil 185 km kullanıcı tablosunda "ikincil kaynak" notlu. Eski model adı/alias silindi; yanlış model görseli kaldırıldı (kullanıcı yeni görsel ekleyecek). Bu kayıt artık "sorunlu" listesinde değil.

## 4. tur — Carraro E-Folding → E-Flexi 20 NEX-8 (aynı gün, kullanıcı kararı)
Kayıt (id 1052) **Carraro E-Flexi 20 NEX-8 2024** olarak yeniden adlandırıldı (kaynak: kullanıcı tablosu). 21 alan girildi (katlanabilir, STEPS E5000 motor, 418 Wh, Nexus 8, MT200, rijit alüminyum maşa, Schwalbe Big Apple 20 x 2.125, ECO'da 130 km üretici beyanı). `motor_type: mid-drive` tabloda yazmıyor; aynı STEPS E5000 motoru E-Time Easy tablosunda "Orta" olarak geçtiği için girildi. Eski model adı/alias silindi; görsel kaldırıldı (kullanıcı ekleyecek). "Model bulunamadı" listesinden çıktı (kalan 4: Corelli E-City, Salcano E-Bike EX1, Skyjet XS25, Strada Mobility E-City).

## 5. tur — Kuba Speedlight 2022 (kullanıcı tablosu)
Epey'den gelen 11 alan kullanıcı tablosuyla birebir uyumlu çıktı (250 W, 36 V, 280,8 Wh, 30 km, 3 sa, 7 vites, 20"). Eklenen: azami taşıma 100 kg, lastik CST (marka; ölçü yok). Güncellenen: fren "Mekanik disk" → "Ön ve arka mekanik disk". AI özeti yenilendi. Toplam 13 alan.

## 6. tur — RKS NERO-M 2026 (kullanıcı tablosu)
Mevcut 13 alan tabloyla uyumlu (250 W, 48 V, 624 Wh, 25 km/s, 60 km, 7 vites, 20" alaşım). Eklenen 8 alan: ağırlık 28 kg, azami taşıma 120 kg, şarj 6 sa (4–6'nın üstü), XOD hidrolik disk fren, Kenda 20 x 4.5 lastik, kilitlenebilir ön süspansiyon, ön LED aydınlatma, M6 renkli LCD gösterge. Vites yazımı ayrıntılandırıldı. AI özeti yenilendi. Toplam 21 alan. Girilmeyen (alan yok): Samsung batarya markası, krank/zincir/sele/gidon ayrıntıları, EN 15194 sertifikası, 2 yıl garanti.

## 7. tur — RKS RD8 2026 (kullanıcı tablosu)
Mevcut 13 alan tabloyla uyumlu (250 W, 48 V, 576 Wh, 25 km/s, 70 km, 7 vites, 20" alaşım). Eklenen 8 alan: ağırlık 34 kg, azami taşıma 134 kg, şarj 8 sa (6–8'in üstü), XOD hidrolik disk, CST lastik (ölçü yok), Mozo kilitlenebilir ön süspansiyon, ön LED, M6 renkli LCD. Vites yazımı ayrıntılandırıldı. AI özeti yenilendi. Toplam 21 alan. Not: Epey 2024 "La Rose Ultra RD8" ön+arka süspansiyon diyor; kullanıcı tablosu yalnız ön süspansiyon → tablo esas alındı. Girilmeyen (alan yok): Tianeng batarya markası, krank/zincir/sele/gidon, CE/EN 15194, 2 yıl garanti.

## 8. tur — Skyjet Nitro Pro 2025 (kullanıcı tablosu)
Mevcut 16 alan tabloyla uyumlu (250 W, 36 V, 360 Wh, 25 km/s, 45 km, 6 sa, 6 vites). Eklenen 5 alan: kadro çelik (Epey 2024 alüminyum/alaşım diyordu; kullanıcı tablosu esas — yıl 2025 doğrulandı), 27 kg, azami taşıma 135 kg, ön LED, LCD gösterge. Güncellenen: fren → "Ön ve arka YX-DB06 çelik disk", süspansiyon → "Ön: çatal süspansiyon", jant → 20" alüminyum. AI özeti yenilendi. Toplam 21 alan. Girilmeyen (alan yok): Hupo batarya markası, krank/zincir/pedal, sele, gidon, 2 yıl garanti.

## 9. tur — Volta VB5 2026 (kullanıcı tablosu)
Mevcut 13 alan tabloyla uyumlu (250 W, 36 V, **10 Ah / 360 Wh**, 25 km/s, 40 km, çıkarılabilir, 120 kg) → A101'in 13,5 Ah (486 Wh) değeri **çürütüldü**, kayıttaki 10 Ah doğru. Eklenen 6 alan: şarj 5 sa (4–5'in üstü), 5 kademe destek, 24" jant, 24 x 1.95 lastik, dijital gösterge, 34,55 kg. Güncellenen: fren "Ön ve arka disk" → "Ön ve arka mekanik disk". AI özeti yenilendi. Toplam 19 alan. Girilmeyen (alan yok): kadro tipi alçak geçişli, tekerlek sayısı 3, sele, 2 yıl garanti.

## 10. tur — RKS XS25 2023 (kullanıcı tablosu)
Kullanıcı tablosu, daha önce girilen Epey 2023 kaydıyla birebir aynı (250 W, 36 V, 10 Ah/360 Wh, 45 km, 6 sa, 7 vites, 20", mekanik disk, ön yaylı süspansiyon, 27 kg) → kayıt zaten tabloyla dolu (26 alan), tutarsızlık yok. Yalnız yazımlar tabloya uyduruldu: kadro "Alüminyum / alaşım", jant "20" (alüminyum / alaşım jant)". Kullanıcı tablosunda olmayan mevcut alanlar korundu (124 kg taşıma, 20x4.0 lastik, yürüme desteği vb.). AI özeti yenilendi.

## 11. tur — Strada Mobility E-City → Strada E-Lite 2025 (kullanıcı kararı)
Kayıt (id 1058) **Strada E-Lite 2025** olarak yeniden adlandırıldı: marka "Strada Mobility" → "Strada", model "E-City" → "E-Lite" (28" sürümü; kullanıcı model adında "28" istemedi). Sıra: önce model, sonra marka. Marka/model alias'ları silindi (eski adresler 404). 20 alan girildi (28" şehir, arka tekerlek motoru 250 W, 468 Wh çıkarılabilir kadro içi batarya, Shimano Cues 9 vites, Logan hidrolik disk, 63 mm kilitlenebilir maşa, 5 destek kademesi, yürüme modu, entegre bagaj). Girilmeyen: menzil/hız/ağırlık (tabloda yok). Yanlış model görseli kaldırıldı (kullanıcı ekleyecek). "Model bulunamadı" listesinden çıktı (kalan 3: Corelli E-City, Salcano E-Bike EX1, Skyjet XS25).

## 12. tur — Corelli E-Lite-S 2024 (yeni kayıt, kullanıcı tablosu)
Yeni kayıt (id 1065, `corelli-e-lite-s-2024`) `aracEkle` ile eklendi; 22 alan girildi (28" şehir, Aikema arka göbek motor 250 W / 45 Nm, LG hücreli 460,8 Wh, 40–60 km, Shimano Altus 8 vites, Shimano hidrolik disk, Suntour NEX maşa, ön-arka taşıyıcı ve aydınlatma, 20,8 kg). AI özeti yazıldı (onaylı). Girilmeyen: kadro boyu, sele borusu/gidon, orta göbek/zincir. Mevcut "Corelli E-City 2024" kaydı (özelliksiz, model resmi listede yok) DOKUNULMADI — kullanıcı "ekleyelim" dedi; E-City'nin kaldırılıp kaldırılmayacağı açık.

## 13. tur — Corelli E-Lite-L 2024 (yeni kayıt, kullanıcı tablosu)
Yeni kayıt (id 1066, `corelli-e-lite-l-2024`) `aracEkle` ile eklendi (E-Lite-S ile ad benzerliği uyarısı çıktı → farklı model olduğu için onaylandı); 20 alan girildi (28" şehir, Bafang M400 orta motor 250 W / 80 Nm, LG hücreli 460,8 Wh, 50–70 km, Shimano Deore 10 vites, Shimano hidrolik disk, Suntour NEX maşa, 24,7 kg). AI özeti yazıldı (onaylı). Girilmeyen: kadro boyu, sele borusu/gidon, orta göbek/zincir/aynakol detayı, taşıyıcı/aydınlatma (tabloda yok).

## 14. tur — Corelli E-City 2024 silindi (kullanıcı kararı)
Kayıt (id 1054, `corelli-e-city-2024`, özelliksiz; model Corelli'nin resmi listesinde yok) tamamen silindi: ürün (denetim kaydıyla), boşta kalan model (#765 E-City), görsel dosyası (blob). Bağlı yorum/favori/garaj/takas vb. yoktu (0). Aktif e-bisiklet 55. "Model resmi listede yok" grubundan çıktı (kalan: Salcano E-Bike EX1 2022, Skyjet XS25 2023).

## 15. tur — Kuba Speedlight Pro 2024 (kullanıcı tablosu)
Epey 2024'ten girilen 12 alan kullanıcı tablosuyla birebir uyumlu çıktı (6 vites, mekanik disk, alüminyum/alaşım, 20", süspansiyon yok, 22 kg, 36 V, 280,8 Wh, 250 W, 25 km, 5 sa, katlanabilir) → yıl 2024 ve veriler ikinci kaynakla doğrulandı. Eklenen 11 alan: motor tipi (arka tekerlek elektrik motoru → hub), 25 km/s, standart pedelec sınıfı, Shimano 6 vites, lastik 20 x 1,75, azami taşıma 110 kg, LCD, ön-arka LED aydınlatma, çamurluklar, arka bagaj. Güncellenen: fren → "Ön ve arka mekanik disk". AI özeti yenilendi. Toplam 23 alan.

## 16. tur — Kuba Speedlight 2022 (kullanıcı tablosu, 2. kez)
Mevcut 13 alanın dokuzu yeni tabloyla uyumlu. **Çelişki:** azami taşıma önceki tabloda 100 kg, bu tabloda 109 kg → kullanıcının son değeri esas alındı (109). Eklenen 13 alan: hub motor, 25 km/s, standart pedelec, 5 destek kademesi, çıkarılabilir batarya, 21 kg, Shimano 7 vites, LCD, ön-arka LED, çamurluk, bagaj, katlanmış ölçü (90 × 40 cm). Lastik "CST 20" şehir tipi". AI özeti yenilendi. Toplam 26 alan. Girilmeyen (alan yok): kadro boyu, katlanabilir pedal/sele/gidon ayarı, korna, telli jant, açık ölçüler, 2 yıl garanti.

Kayıt (id 1056) **Salcano Wind 1 2022** olarak yeniden adlandırıldı (model "E-Bike EX1" → "Wind 1", eski model adresi alias; ürün adresi salcano-e-bike-ex1-2022 sabit kaldı). 14 alan girildi (700C trekking/şehir, Bafang arka göbek motoru 249 W, 36 V 540 Wh kadroya entegre batarya, Acera 9 vites, hidrolik disk MT200, SR Suntour NEX-E25 HLO mekanik kilitli maşa, Maxxis Overdrive Excel 700 x 40C). Batarya çıkarılabilirliği tabloda yazmadığı için girilmedi; menzil/hız/ağırlık tabloda yok. AI özeti yazıldı, fotoğraf korundu. "Model resmi listede yok" grubundan çıktı (kalan: Skyjet XS25 2023).

## 15. tur — Salcano Cappadocia 1 2022 (yeni kayıt, kullanıcı tablosu)
Yeni kayıt (id 1067, `salcano-cappadocia-1-2022`) `aracEkle` ile eklendi; 13 alan girildi (27,5" MTB, Bafang arka göbek motoru 250 W, 36 V 576 Wh kadroya entegre batarya, Acera 24 vites, hidrolik disk MT200, Zoom yaylı mekanik kilitli maşa, Maxxis Crossmark II 27,5 x 2,25). Batarya çıkarılabilirliği, menzil/hız/ağırlık tabloda yok. AI özeti yazıldı (onaylı); görseli kullanıcı ekleyecek.

## 16. tur — Salcano Cappadocia 2 2022 (yeni kayıt, kullanıcı tablosu)
Yeni kayıt (id 1068, `salcano-cappadocia-2-2022`) `aracEkle` ile eklendi (Cappadocia 1 ile ad benzerliği → farklı model, onaylandı); 13 alan girildi (27,5" hardtail MTB, Bafang arka göbek motoru 249 W, 36 V 540 Wh kadroya entegre batarya, Altus 8 vites, hidrolik disk MT200, Zoom yaylı mekanik kilitli ön maşa, arka süspansiyon yok, Maxxis Crossmark II 27,5 x 2,25). Batarya çıkarılabilirliği, menzil/hız/ağırlık tabloda yok. AI özeti yazıldı (onaylı); görseli kullanıcı ekleyecek.

## 17. tur — Skyjet XS25 2023 → Skyjet S25 2023 (kullanıcı tablosu)
Kayıt (id 1049) **Skyjet S25 2023** olarak yeniden adlandırıldı (model "XS25" → "S25", eski model adresi alias; ürün adresi skyjet-xs25-2023 sabit). 19 alan girildi (16" katlanabilir, RKS 250 W motor, 25 km/sa, 36 V 270 Wh, tek vites, mekanik disk, LCD, aydınlatma, 22 kg, 118 kg). Menzil 25–35 km ve şarj 4–6 saat aralık olduğu için üst değerler (35 km, 6 sa) girildi, özet metinde aralık yazıldı. Fotoğraf korundu. "Model resmi listede yok" grubu boşaldı.

Salcano Wind 1 2022 AI özeti yeniden yazıldı: özellik listesi tonundan çıkarılıp ≤2 rakamlı, kuruluma yorumlayan teknik metne çevrildi (Wh/W/V rakamları kaldırıldı; özellikler tabloda zaten var).

Salcano Cappadocia 1 (1067), Cappadocia 2 (1068) ve Skyjet S25 (1049) AI özetleri aynı tona (az rakamlı, kuruluma yorumlayan teknik metin) yeniden yazıldı.

Temizlik: Salcano Wind 1 (1056) ve Skyjet S25 (1049) ürün adresleri yeni adlarına çekildi (salcano-wind-1-2022, skyjet-s25-2023), görsel dosyaları yeni adla taşındı, eski dosyalar silindi; eski model alias kayıtları (salcano-e-bike-ex1, skyjet-xs25) silindi. E-bisiklette ad–adres uyumsuz kayıt kalmadı; "XS25" yalnız RKS XS25 için geçiyor (doğru).

## 18. tur — Ape Ryder MD-10 Pro 2025 (kullanıcı tablosu)
Kayıt (id 1055) 19 alana tamamlandı: fatbike (enumda yok → MTB), Bafang M410 orta motor (250 W / 80 Nm, 25 km/sa), 48 V, Samsung hücre, 20 x 4,5 Kenda, Shimano 7 vites, XOD hidrolik disk, ön-arka süspansiyon, LCD C6. Aralıklı değerlerde üst değerler girildi (720 Wh, 7 sa şarj, menzil 80 km = ilan edilen azami; 55–70 km tablo aralığı girilmedi). Ağırlık kaynaklarda 38–43,2 kg farklı: mevcut 38 kg korundu, özet metinde rakam yazılmadı. M410 orta motor olarak sınıflandırıldı (tabloda yalnız "elektrik motoru"). AI özeti yeni tonda yazıldı. Görsel korundu.

## 19. tur — RKS MX25 Pro 2026 (kullanıcı tablosu)
Kayıt (id 1059) 17 alana tamamlandı (katlanır 20", RKS arka hub motor 250 W, 36 V 280,8 Wh, 6 vites Shimano, ön-arka disk, LCD, LED aydınlatma, Kenda lastik). Aralıklı değerlerde üst değerler girildi (menzil 45 km, şarj 6 sa; 35–45 / 4–6 tablo aralığı özette). Motor tipi tabloda "elektrik motoru"; mevcut hub-drive korundu. Tabloda olmayan/doğrulanmamış: süspansiyon, ağırlık, taşıma kapasitesi, lastik ölçüsü, bagaj, çıkarılabilir batarya (girilmedi; sibling MX25 verisi kopyalanmadı). CE/EN 15194 ve 2 yıl garanti için alan yok. AI özeti yeni tonda yazıldı.

## 20. tur — RKS Lesso Pro 2026 (kullanıcı tablosu)
Kayıt (id 1033) kullanıcı tablosuna göre yeniden girildi (17 alan): bisiklet tipi katlanabilir → şehir (tabloda katlanır yok, alçak girişli kadro), menzil 50 → 40 km (tablo 35–40), şarj 6 sa, 360 Wh, 24 kg, 124 kg, kilitlenebilir ön çatal, S866 LCD, 7 vites Shimano. Tabloda olmayan eski alanlar (bagaj, çıkarılabilir batarya, çamurluk) kaldırıldı. Aralıkta üst değer girildi; alternatif 35–45 km girilmedi. Arka süspansiyon doğrulanmadı. Yolcu selesi/sırtlık, garanti, sertifika, renk için alan yok. AI özeti (PENDING idi) yeni tonda yazıldı ve onaylandı.
Düzeltme: "Alçak girişli kadro" kadro tipi, malzeme değil; frame_material alanı kaldırıldı (16 alan).

## 21. tur — RKS XS35 2026 (kullanıcı tablosu)
Kayıt (id 1060) 19 alana tamamlandı: katlanır 20" fat (CST 20 x 4,0), RKS arka hub motor 250 W, 36 V 360 Wh, menzil 40 / şarj 6 sa (üst değer; aralık 35–40, 4–6), 7 vites Shimano + CD408 zincir, mekanik disk, kilitlenebilir yaylı ön çatal, LCD, arka bagaj, 24 kg, 120 kg. Arka süspansiyon doğrulanmadı. Garanti, sertifika, renk, sele/krank/gidon için alan yok. Motor tipi tabloda "elektrik motoru"; mevcut hub-drive korundu. AI özeti yeni tonda yazıldı.

## 22. tur — RKS MX55 Pro 2026 (kullanıcı tablosu)
Kayıt (id 1036) tabloya göre yeniden girildi (18 alan): vites 6 → 7, 270 Wh, menzil 35 / şarj 6 sa (üst değer; aralık 25–35, 4–6), S866 LCD, bagaj + çamurluk, 22 kg, 122 kg (satıcılarda 120–125). Tabloda doğrulanmayan/olmayan eski alanlar kaldırıldı: kadro malzemesi (Alüminyum), yürüme desteği, çıkarılabilir batarya. Lastik ölçüsü, süspansiyon doğrulanmadı. Garanti, renk, mevzuat notu için alan yok. AI özeti (PENDING idi) yeni tonda yazıldı ve onaylandı.

## 23. tur — RKS RSI-X-PRO 2026 (kullanıcı tablosu)
Kayıt (id 1061) 19 alana tamamlandı: kadro "Alüminyum" → "Çelik" (tabloda "bazı katalog kayıtlarında"; kaynaklar çelişkili, özette belirtildi), lastik "Fat tire" → CST 20", 360 Wh, menzil 45 / şarj 6 sa (tablo 35–45, üretici 45–60; üretici aralığı girilmedi), 24 kg (alternatif 27–33), 135 kg (alternatif 127–150), YX-DB06 disk, S866 LCD, plastik çamurluk, Shimano TX50/RD-300D/MF-TZ500 + KMC27 + Prowheel krank vites satırında. Lastik ölçüsü, arka süspansiyon, garanti doğrulanmadı. AI özeti yeni tonda yazıldı.

## 24. tur — Volta VB1 2026 (kullanıcı tablosu)
Kayıt (id 1039; VB1 Neo 1040 ayrı kayıt, dokunulmadı) 19 alana tamamlandı: alüminyum katlanabilir 20" (20 x 1,75), BLDC arka göbek motor 250 W, 36 V, aralıklı değerlerde üst değer (316,8 Wh, menzil 42 km, şarj 6 sa; kaynaklar 7,8–8,8 Ah / 27–42 km, alternatif ilan 30–35 km), 22,5 kg, 110 kg, ön mekanik + arka hidrolik disk, Shimano 7 vites, LCD, aydınlatma, bagaj. Arka süspansiyon doğrulanmadı; garanti, renk, standart için alan yok. AI özeti yeni tonda yazıldı.

## 25. tur — Volta VB1 Neo 2026 (kullanıcı tablosu)
Kayıt (id 1040) 20 alana tamamlandı; eski menzil 55 km yanlıştı → 42 km (tablo 27–42, üst değer). 280,8 Wh, şarj 5 sa (4,5–5), BLDC arka göbek 250 W, 5 destek kademesi, 22,5 kg (bisiklet kütlesi; toplam 24,8 kg girilmedi), 110 kg, ön mekanik + arka hidrolik disk (160 mm), teleskopik ön çatal, arka süspansiyon yok, LCD, ön LED, bagaj. Arka aydınlatma doğrulanmadı. Garanti, renk için alan yok. AI özeti yeni tonda yazıldı.

## 26. tur — Salcano Cappadocia 1 ve 2 (kullanıcı tabloları)
Cappadocia 1 (id 1067): lastik Maxxis Crossmark II → Continental Cross King 27,5 x 2,2 (son tablo kazanır); diğer alanlar aynı. Cappadocia 2 (id 1068): azami taşıma kapasitesi 135 kg eklendi; diğer alanlar tabloyla aynı. Kadro boyları, kadro tipi/hız/menzil/ağırlık için alan yok ya da doğrulanmadı. İki AI özeti de güncellendi.

Super73 S2 2020 (id 1006): bisiklet tipi "şehir" girildi (fat/moped tarzı için enumda karşılık yok; MTB yanıltıcı olurdu, R Brooklyn ile tutarlı). AI özeti yeniden yazıldı (şehir içi + hafif arazi; konfor/ağırlık yorumu çıkarıldı).

## 27. tur — Roxform R-300 2023 (kullanıcı tablosu)
Kayıt (id 1057) 19 alana tamamlandı: ağırlık (31 kg) kaldırıldı (tablo "sabit değer girilmemeli"), hub-drive motor, 460,8 Wh, aralıkta üst değerler (menzil 60 km, hız 35 km/sa, şarj 6 sa, taşıma 127 kg; ilan aralıkları 45–60 / 30–35 / 4–6 / 120–127), bagaj. Gaz kolu için alan yok (özette). 350 W+ ve 13–20 Ah varyantları girilmedi. AI özeti yeni tonda yazıldı.
Roxform R-300 2023 AI özeti sadeleştirildi: uyarı yığını tek hız-sınıfı notuna indirildi, "düzensiz zeminlerde avantaj" gibi çıkarım kaldırıldı.

## 28. tur — RKS RS3 Pro Max 2026 (kullanıcı tablosu)
Kayıt (id 1032) tabloya göre yeniden girildi (14 alan): menzil 50 → 45 km (tablo 35–45, üst değer), şarj 6 sa, 360 Wh eklendi, CD408 zincir, ön-arka disk, süspansiyonlu çatal, LCD. Tabloda olmayan eski alanlar kaldırıldı: kadro malzemesi, 120 kg taşıma, yürüme desteği, çıkarılabilir batarya, bagaj, çamurluk. Ağırlık/taşıma doğrulanmadı. AI özeti (PENDING idi) yeni tonda yazıldı ve onaylandı.

## 29. tur — Menzili boş 6 e-bisiklet (araştırma, değişiklik yok)
Menzil alanı boş 6 kayıt arandı: Salcano Wind 1 / Cappadocia 1 / Cappadocia 2 2022 (Salcano resmi sayfaları, bikes4sale, Epey: km yok; Cappadocia 2 sayfasında yalnızca "günlük sürüşler için yeterli menzil"), Cube Kathmandu Hybrid Pro 625 2023 (bikes.de, Cube arşivi yönlendirdi/404: km yok), Trek Allant+ 7 Stagger 2023 (BIKE Magazin, Trek GB/FAQ: km yok), Strada E-Lite 2025 (resmi site bulunamadı, Akakçe 403). Kaynaksız değer yazılmadı; kararla alan boş bırakıldı. Not: Trek FAQ Allant+ 7 serisi için 500 Wh, BIKE Magazin 625 Wh diyor; kayıtta 625 Wh (doğrulanmadı). Açık: Salcano katalog/kullanım kılavuzu dosyaları okunmadı; kullanıcı kaynak verirse girilir.

## 30. tur — Menzil değerleri (kullanıcı tablosu)
İndirilen Salcano 2026 kataloğu (15,9 MB) okunmadan silindi; kullanıcı kendi tablosunu verdi ve "bu kayıtlara göre güncelle" dedi. Menzil (üst değer girildi; tablo aralıkları): Salcano Wind 1 2022 90 km (60–90, tahmini), Cappadocia 1 2022 90 km (60–90, tahmini), Cappadocia 2 2022 85 km (55–85, tahmini), Cube Kathmandu Hybrid Pro 625 2023 150 km (60–150, kullanıma bağlı geniş aralık), Trek Allant+ 7 Stagger 2023 80 km (50–80), Strada E-Lite 2025 70 km (60–70, satıcı ilanı; 13 Ah / 36 V = 468 Wh ile uyumlu). Salcano ve Cube/Trek değerleri üretici beyanı değil, tahmin/aralıktır. AI özetlerine rakam eklenmedi.
