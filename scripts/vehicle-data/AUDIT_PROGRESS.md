# Araç Veri Denetimi — İlerleme Takibi

**Amaç:** `scripts/vehicle-data/<kategori>/<marka>.json` dosyalarındaki model/nesil/versiyon/trim bilgilerini gerçek Türkiye pazar verisiyle karşılaştırıp eksik/hatalı olanları düzeltmek (örn. Honda Jazz'da eksik nesiller).

**Yöntem:** Her marka için her model, web aramasıyla gerçek nesil/versiyon/trim listesiyle karşılaştırılır. Eksik nesil eklenir, versiyon/trim listeleri güncellenir. Kaydedilen her marka commit edilir.

**Devam etme kuralı:** Bu dosyadaki "Bekliyor" (⬜) durumundaki ilk markadan devam et — öncelik sırası Tier 1 → Tier 2 → Tier 3. Kategori sırası: otomobil → motosiklet → kamyonet → e-scooter → e-bisiklet → karavan.

**Belirsizlik kuralı:** Nesil/motor bilgisi net kaynaktan doğrulanabiliyorsa yazılır. Trim (donanım paketi) ismi net değilse uydurulmaz — generic ama doğru bir isim kullanılır (örn. "Standart", "4WD"), düşük güven notu düşülür. Nesil hiç bulunamıyorsa eklenmez.

---

## Otomobil (51 marka) — öncelik sırasına göre

### Tier 1 — Türkiye'de en yaygın/çok yorumlanan (önce bunlar)

| Marka | Durum | Not |
|---|---|---|
| honda | ✅ Tamamlandı | Jazz: 4 nesil eklendi (2002-2008 ES/LS/Elite/Sport, 2008-2015 Fun/Joy, 2015-2020 Dream PE/Premium/Elegance, 2020- Elegance/Advance/Crosstar). HR-V: 1999-2006 ilk nesil eklendi (trim isimleri belirsiz, generic "Standart/4WD" — düşük güven). CR-V: tek nesil yerine 5 nesile bölündü. Civic/ZR-V/Accord/e zaten sağlıklıydı. |
| renault | ✅ Tamamlandı | Büyük eksiklik: Türkiye'de Bursa'da üretilen/satılan 15 klasik/tarihsel model tamamen eksikti — 12 Toros, 9 Broadway, 11 Flash, 21 Manager, 19 Europa, Megane (1997-2003), Symbol/Thalia (1999-2013 ve 2013-2021), Fluence, Twingo, Modus, Scenic, Safrane, Laguna, Talisman eklendi. Modern Clio 2-5/Megane 2-4/Taliant/Captur/Kadjar/Koleos/Arkana/Austral/Espace/Zoe/E-Tech serisi zaten sağlıklıydı, dokunulmadı. |
| fiat | ✅ Tamamlandı | Renault gibi Tofaş (Bursa) üretimi klasik modeller tamamen eksikti — Murat 124/Serçe, Şahin, Doğan, Kartal, eski Tipo (1990-1995, mevcut modern "Tipo (2015-)" ile karışmasın diye ayrı), Tempra, Uno, Brava, Marea, Siena eklendi (10 model). Albea/Palio/Stilo/Bravo/Linea/Egea/500/Panda/Doblo zaten sağlıklıydı. |
| volkswagen | ✅ Tamamlandı | Golf 1-3 (1974-1997), Vento, Bora, Jetta eklendi. Passat tek girişten 4 nesle bölündü (1988-1996, 1996-2005, 2005-2014, 2014-). Beetle, Scirocco, Touran, Sharan, Fox, up! eklendi (Türkiye'de üretim geçmişi yok ama bu modeller yaygın ikinci el). Modern Golf 4-8/Polo/Arteon/T-Cross/T-Roc/Tiguan/Touareg/ID serisi/Amarok/Caddy zaten sağlıklıydı. |
| ford | ✅ Tamamlandı | Otosan üretimi klasikler eksikti: Taunus (1985-1993, GL/S/GT/GLS) ve Escort (1993-1999, CL/Classic/CLX/Ghia) eklendi. Kuga tek girişten 3 nesle bölündü (2008-2012, 2012-2019, 2019-). Türkiye'de resmi satılan ama tamamen eksik olan modeller eklendi: Ka (2009-2016), Galaxy (3 nesil: 1995-2006/2006-2015/2015-), S-Max (2 nesil), C-Max (2003-2010) + Grand C-Max (2010-2019), B-Max (2012-2017), Edge (2016-2019), Tourneo Custom (Transit Custom'ın yolcu versiyonu, eksikti). Fiesta/Focus/Mondeo/Mustang/Puma/EcoSport/Ranger/Transit Connect vb. zaten sağlıklıydı, dokunulmadı. |
| toyota | ✅ Tamamlandı | Adapazarı (TMMT) üretimi 7. nesil Corolla (1994-2001) tamamen eksikti, eklendi. Tamamen eksik olan modeller eklendi: Corolla Verso (2001-2009), Verso (2009-2018), Avensis (3 nesil: 1998-2003/2003-2009/2009-2018), Auris (2 nesil: 2007-2012/2012-2018), Aygo (2 nesil: 2005-2014/2014-2022 — Aygo X'ten farklı, Peugeot 107/Citroën C1 kardeşi), Starlet (1990-1999). Tek nesil olarak duran modeller nesillere bölündü: Yaris (4 nesil, 1999-2005'ten 2020-'e), C-HR (2016-2023 eklendi, Sakarya'da üretiliyor + 2023- mevcut), RAV4 (5 nesil, 1994-2000'den 2019-2025'e), Land Cruiser (4 nesil: 80/100/200/300 seri), Land Cruiser Prado (3 nesil: J90/J120/J150), Hilux (3 nesil: 1997-2005/2005-2015 Vigo/2015- Revo). Camry'nin 1992-2006 arası Türkiye'de ithal satılan eski nesli tek genel girişle eklendi (düşük güven, dönem/trim detayı net değil). Corolla Cross/Yaris Cross/Prius/bZ4X/Proace City zaten sağlıklıydı. |
| hyundai | ✅ Tamamlandı | Dosyada sadece en güncel nesiller vardı, en büyük eksiklik buydu. Assan/İzmit fabrikasının asıl ürünü **Accent tamamen eksikti** — 5 Türkiye dönem adıyla eklendi (1994-2000 Yumurta Kasa, 2000-2003 Milenyum, 2003-2006 Admire, 2006-2012 Era, Accent Blue 2010-2018). Tamamen eksik nameplate'ler eklendi: Elantra (6 nesil, 1991-2021), Getz, Atos, Matrix, ix20, Sonata (3 nesil), Coupe/Tiburon (2 nesil), Veloster, Trajet, i40, Ioniq (hibrit/PHEV, Ioniq 5/6'dan ayrı). Tek nesil olarak duran modeller gerçek nesil sayısına bölündü: i10 (3 nesil), i20 (3 nesil), i30 (3 nesil + N), Tucson (Tucson 2004-2009 → ix35 2009-2015 → Tucson 2015-2020 → 2020-), Santa Fe (4 nesil). Genesis/Grandeur/Santamo/Excel/Terracan gibi çok niş/düşük hacimli modeller kapsam dışı bırakıldı (Ford'daki Sierra/Cortina kararına benzer). Kona/Kona Electric/Ioniq 5/Ioniq 6/i30 N/Bayon zaten tek nesil olarak sağlıklıydı. |
| opel | ✅ Tamamlandı | Corsa/Astra dizisi zaten iyi durumdaydı ama eski nesiller eksikti: Corsa A (1982-1993), Corsa B (1993-2000), Astra F (1991-1998), Kadett E (1984-1991, Astra'nın atası) eklendi. Vectra tamamen eksikti (A/B/C, 3 nesil) — Insignia'nın atası, çok yaygın D-segment. Diğer tamamen eksik nameplate'ler eklendi: Ascona, Omega (A/B), Zafira (A/B/C, çok yaygın MPV/taksi), Meriva (A/B), Tigra, Agila, Antara. Insignia/Mokka/Mokka-e/Crossland/Grandland/Combo Life zaten sağlıklıydı. |
| peugeot | ✅ Tamamlandı | Dosyada sadece güncel PSA-dönemi (208/308/408/508/2008/3008/5008) modelleri vardı, klasik dönem tamamen eksikti. Tofaş-Bursa üretimi 405 (1987-1997, üretim 1991'den) eksikti, eklendi. Türkiye'de çok yaygın ikinci el nameplate'ler eklendi: 206 (1998-2012, 1270+ ilan), 301 (2012-2022, Türkiye'ye özel bütçe sedan), 307 (2001-2008), 106, 107, 1007, 206+, 306, 406, 407, 806/807 (MPV), Partner Tepee/Bipper Tepee (yolcu versiyonları), RCZ (coupe, niş ama gerçek). |
| citroen | ✅ Tamamlandı | Peugeot ile aynı desen — dosyada sadece güncel PSA-dönemi modelleri vardı, klasik/orta dönem tamamen eksikti. C-Elysée (Peugeot 301'in platform kardeşi, Türkiye'de çok satan bütçe sedan) eklendi. Diğer eksik nameplate'ler: Saxo, C2, ZX, Xantia, Xsara, Xsara Picasso, C3 Picasso, C4 (2 eski nesil), C4 Picasso/Grand C4 Picasso, C5 (2 eski nesil), C8. AX/BX/XM/Evasion/C6 çok niş/düşük hacimli olduğu için kapsam dışı bırakıldı (Ford'daki Sierra/Cortina kararına benzer). |
| dacia | ✅ Tamamlandı | Dosya zaten görece sağlıklıydı ama iki tamamen eksik nameplate vardı: Dokker (2012-2021, ticari/MPV, Türkiye'ye özel Stepway versiyonu dahil) ve Lodgy (2012-2022, 7 koltuklu MPV) eklendi. Ayrıca önemli bulgu: Duster Temmuz 2024'ten itibaren Türkiye'de Dacia değil **Renault** markasıyla satılıyor (Bursa/Oyak Renault üretimi) — bu yüzden "Duster (2017-)" → "Duster (2017-2024)" olarak sınırlandırıldı ve yeni nesil "Duster (2024-)" `renault.json`'a Renault modeli olarak eklendi. Logan/Sandero/Jogger/Spring/Bigster zaten sağlıklıydı, dokunulmadı. |
| kia | ✅ Tamamlandı | Güncel model dizisi (Picanto/Rio/Ceed/ProCeed/Stinger/Sportage/Sorento/Niro/EV6/EV9) sağlıklıydı ama tüm klasik/orta dönem nameplate'ler tamamen eksikti — Cerato (3 nesil, 2004-2018), Optima/Magentis (4 nesil, 2000-2020), Carens/Rondo (3 nesil, 2000-2019), Carnival/Sedona (3 nesil, 1998-2020), Soul (2 nesil, 2008-2019), Venga, XCeed eklendi. Sorento tek girişten 4 nesle bölündü (2002-2009/2009-2014/2014-2020/2020-). |
| skoda | ✅ Tamamlandı | Güncel dizi (Fabia/Rapid/Octavia/Scala/Kamiq/Karoq/Kodiaq/Enyaq) sağlıklıydı. Superb tek girişten 4 nesle bölündü (2001-2008/2008-2015/2015-2023/2023-). Tamamen eksik nameplate'ler eklendi: Favorit/Felicia (1988-2001, VW öncesi dönem, tek genel girişle düşük güven), Roomster (2006-2015 MPV), Yeti (2009-2017 kompakt SUV), Citigo (2011-2019 şehir arabası). |
| mercedes-benz | ✅ Tamamlandı | Dosyada sadece güncel nesiller vardı, klasik/eski nesiller sistematik eksikti. 190 (W201, 1982-1993) eklendi. E-Serisi'ne eski nesiller eklendi: W123 (1976-1985), W124 (1985-1995), W210 (1995-2002) — mevcut W211/W212/W213'ün öncülü. S-Serisi tek girişten 6 nesle bölündü: W126/W140/W220/W221/W222/W223. A-Serisi ve B-Serisi'ne eski nesiller eklendi (W168/W169/W176, W245/W246), mevcut girişler W177/W247 olarak yeniden adlandırıldı. CLA (C117 eklendi, mevcut C118) ve GLA (X156 eklendi, mevcut H247) benzer şekilde bölündü. Tamamen eksik nameplate'ler eklendi: CLK (C208/C209), CLS (C219/C218/C257), SLK/SLC (R170/R171/R172), M Serisi/ML (W163/W164/W166 — GLE'nin atası), GLK (X204 — GLC'nin atası), GL Serisi (X164/X166 — GLS'nin atası), V Serisi (2014-, yolcu MPV). |
| bmw | ✅ Tamamlandı | Dosya güncel nesiller açısından zaten iyi durumdaydı (1/2/4 Serisi, X2/X4/X7, i-serisi tek nesil olarak sağlıklı). Eksik olan eski nesillerdi: 3-Serisi'ne E30 (1982-1994) ve E36 (1990-2000) eklendi, mevcut girişler E46/E90/F30/G20 olarak adlandırıldı. 5-Serisi'ne E34 (1987-1996) ve E39 (1995-2003) eklendi, mevcut girişler E60/F10/G30. 7-Serisi tek girişten 5 nesle bölündü (E38/E65-66/F01-02/G11-12/G70). 6-Serisi tamamen eksikti, 3 nesil eklendi (E24/E63-64/F12-13). 8-Serisi tamamen eksikti, E31 (1991-1997) ve G14-16 (2018-) eklendi. X1/X3/X5/X6'ya eski nesiller eklendi (E84, E83/F25, E53/E70/F15, E71/F16), mevcut güncel girişler G01/G05/G06 olarak adlandırıldı. Z3 (1996-2002, Z4'ün atası) tamamen eksikti, eklendi. |
| audi | ✅ Tamamlandı | Diğer premium markaların aksine A3 zaten nesillere bölünmüştü, ama A5/A6/A7/A8/Q3/Q5/Q7/TT tek girişten ibaretti — gerçek nesillere bölündü: A5 (2 nesil, 8T/F5), A6 (5 nesil, C4-C8), A7 (2 nesil, 4G/4K), A8 (4 nesil, D2-D5), Q3 (2 nesil), Q5 (2 nesil, 8R/FY), Q7 (2 nesil, 4L/4M), TT (3 nesil, 8N/8J/8S). A4'e B5 (1994-2001) öncül nesil eklendi. Tamamen eksik nameplate'ler eklendi: A2 (1999-2005), Q4 e-tron (2021-, elektrikli SUV), ve Türkiye ikinci el pazarında çok yaygın olan **Audi 80** (A4'ün atası) ve **Audi 100** (A6'nın atası) — generic versiyon/trim, düşük güven notu. Coupe/Cabriolet/V8 niş oldukları için kapsam dışı bırakıldı. |
| nissan | ✅ Tamamlandı | Beklenen desen: dosyada sadece güncel nesiller vardı. Türkiye'de çok yaygın klasik nameplate'ler tamamen eksikti — Sunny (1990-2000), Almera (2 nesil, N15/N16, Sunny'nin yerine geçti), Primera (3 nesil, P10/P11/P12, D-segment), Terrano (Nissan Terrano II, 1993-2006 SUV). Patrol tamamen eksikti, 3 nesille eklendi (Y60/Y61/Y62). X-Trail tek girişten 4 nesle bölündü (T30-T33/güncel), Note eski nesil (2006-2013, E11) eklendi, Pixo (2009-2013, Suzuki Alto rebadge) eklendi. Micra/Juke/Qashqai/Leaf/Ariya zaten sağlıklıydı. |
| mazda | ✅ Tamamlandı | Aynı desen — dosyada sadece güncel nesiller vardı. 2/3/6/CX-5 tek girişten gerçek nesillere bölündü (3 ve 6 dörder nesle: BK-BP, GG-GL). Tamamen eksik klasik nameplate'ler eklendi: 323 (1989-2003, 3'ün atası), 626 (1987-2002, 6'nın atası), MPV (1999-2006), Premacy (1999-2018), 5 (2005-2015, Premacy'nin global adı), Tribute (2000-2011, Ford Escape platform kardeşi), CX-7 (2006-2012), CX-9 (2006-2015). CX-3/CX-30/CX-60/MX-5/MX-30 zaten sağlıklıydı. |
| suzuki | ✅ Tamamlandı | En büyük eksiklik: **Jimny tamamen eksikti** — Türkiye'de çok popüler off-roader, 2 nesille eklendi (1998-2018 ve 2018-). Samurai (Jimny'nin atası) eklendi. Vitara tek girişten gerçek nesillere bölündü: Vitara (1988-1998) → Grand Vitara (1998-2005, 2005-2015) → Vitara (2015-). Swift tek girişten 4 nesle bölündü (1989-2003/2004-2010/2010-2017/2017-). Tamamen eksik nameplate'ler eklendi: SX4 (2006-2013, S-Cross'un atası), eski Baleno (1995-2002, sedan/wagon), Splash, Liana, Wagon R+. Alto/Ignis/SX4 S-Cross/Across/Swace zaten sağlıklıydı. |
| seat | ✅ Tamamlandı | Aynı VW-grup deseni (bkz. Skoda/Audi) — Ibiza ve Leon tek girişten gerçek nesillere bölündü (Ibiza 5 nesle, Leon 4 nesle). Tamamen eksik nameplate'ler eklendi: Cordoba (1993-2009, Ibiza sedan versiyonu), Toledo (3 nesil, 1991-2009, D-segment), Altea (2004-2015, kompakt MPV), Alhambra (2 nesil, 1996-2020, büyük MPV). Arona/Ateca/Tarraco zaten sağlıklıydı. |
| jaecoo | ✅ Tamamlandı | Çok yeni marka (Chery grubu), nesil geçmişi yok — web araması ile Türkiye pazar durumu doğrulandı (Temmuz 2026 itibarıyla). **Jaecoo 5 EV** (Nisan-Haziran 2026'da Türkiye'ye girdi) tamamen eksikti, eklendi. Jaecoo 7 ve 8 zaten dosyadaydı; Jaecoo 8'in Türkiye lansmanı henüz gerçekleşmedi (2026 sonu/2027 bekleniyor) ama dosyada olması zararsız, dokunulmadı. |
| omoda | ✅ Tamamlandı | WebSearch ile doğrulandı (Temmuz 2026) — Türkiye pazarında sadece Omoda 5 ve Omoda 7 satışta, Omoda 9 (Avrupa'da satışta) ve Omoda 3 henüz Türkiye'ye gelmedi. Dosya zaten eksiksizdi, değişiklik gerekmedi. |

### Tier 2 — orta yaygınlık / premium ama tanıdık

| Marka | Durum | Not |
|---|---|---|
| volvo | ✅ Tamamlandı | Aynı desen — dosyada sadece güncel nesiller vardı. Türkiye'de çok yaygın klasikler tamamen eksikti: 240 (1974-1993, ikonik RWD sedan/wagon), 940 (1990-1998), 850 (1991-1997). S40/V40/C30/S60/S70/V70/S80/XC60/XC90 tek girişten gerçek nesillere bölündü (S60/S70-V70/S80 3'er nesil, XC60/XC90 2'şer nesil). XC70 (2000-2016, cross country wagon) tamamen eksikti, eklendi. XC40/S90/V90/C40 Recharge/EX30/EX90 zaten sağlıklıydı. |
| mini | ✅ Tamamlandı | Cooper, Cabrio, Clubman, Countryman tek girişten gerçek nesillere bölündü (Cooper 4 nesle: R50/R56/F56/güncel; Cabrio 2 nesle: R57/F57; Clubman 2 nesle: R55/F54; Countryman 3 nesle: R60/F60/güncel). Paceman/Coupe/Roadster (niş, üretimi durmuş modeller) zaten sağlıklıydı, dokunulmadı. Orijinal klasik Mini (1959-2000, İngiliz üretimi, RHD) kapsam dışı bırakıldı — Türkiye ikinci el pazarında pratik olarak yok. |
| jeep | ✅ Tamamlandı | Cherokee, Grand Cherokee, Wrangler tek girişten gerçek nesillere bölündü — Türkiye'de özellikle klasik XJ Cherokee ve WJ/WK Grand Cherokee çok yaygın off-road SUV'lar. Cherokee 4 nesle (XJ/KJ/KK/KL), Grand Cherokee 5 nesle (ZJ/WJ/WK/WK2/WL), Wrangler 4 nesle (YJ/TJ/JK/JL) bölündü. Patriot (2007-2017) tamamen eksikti, eklendi. Renegade/Compass/Avenger/Gladiator/Commander zaten sağlıklıydı. |
| subaru | ✅ Tamamlandı | Aynı desen — çoğu model tek girişten ibaretti. Impreza 5 nesle bölündü (WRX/STI dahil), Legacy 6 nesle, Forester 5 nesle, XV 2 nesle, BRZ 2 nesle. Outback için eski nesiller (1996-2009) tek genel girişle düşük güvenle eklendi. WRX/Solterra zaten sağlıklıydı. |
| mitsubishi | ✅ Tamamlandı | En büyük eksiklik: **Pajero tamamen eksikti** (Türkiye'de çok popüler off-roader), 3 nesille eklendi. Lancer tamamen eksikti, 3 nesille eklendi. Carisma, Galant, Space Wagon, Grandis tamamen eksik nameplate'ler olarak eklendi. Colt tek girişten 3 nesle bölündü (1996-2004 klasik hatchback, 2004-2012, 2023- reborn). ASX ve L200 gerçek nesillere bölündü. |
| land-rover | ✅ Tamamlandı | Aynı desen — Defender/Discovery/Range Rover/Range Rover Sport/Range Rover Evoque tek girişten ibaretti. Klasik Defender (1983-2016) eklendi. Discovery 4 nesle bölündü (1989-2016 + güncel). Range Rover 4 nesle, Range Rover Sport 3 nesle, Evoque 2 nesle bölündü. **Freelander tamamen eksikti** (Türkiye'de çok yaygın kompakt SUV), 2 nesille eklendi. |
| jaguar | ✅ Tamamlandı | XF tek girişten 2 nesle bölündü. Tamamen eksik nameplate'ler eklendi: XJ (bayrak gemisi sedan, 3 nesil), XK (spor coupe/cabrio), X-Type (Mondeo tabanlı, yaygın), S-Type (orta-üst segment sedan). E-Pace/F-Pace/F-Type/I-Pace/XE zaten sağlıklıydı. |
| lexus | ✅ Tamamlandı | IS tek girişten 4 nesle bölündü (XE10-XE30+güncel). RX 4 nesle, NX 2 nesle bölündü. LS eski nesil (2006-2017) eklendi. Tamamen eksik nameplate'ler eklendi: GS (bayrak sedan, 1997-2020, üretimi durdu) ve CT (200h hatchback, 2010-2020). ES/LC/UX/GX/LX zaten sağlıklıydı. |
| alfa-romeo | ✅ Tamamlandı | Dosya zaten görece iyi durumdaydı (147/156/159/MiTo/Giulietta nesillere ayrılmıştı). Klasik nameplate'ler tamamen eksikti: 33, 75, 164, 145/146, 166, GTV/Spider (1995-2005), GT (2003-2010) eklendi. |
| ds | ✅ Tamamlandı | DS 3 ve DS 4 tek girişten 2'şer nesle bölündü (eski Citroën-kökenli 2010-2019/2011-2018 nesilleri + yeni bağımsız DS nesilleri). **DS 5 tamamen eksikti** (2011-2018, Citroën DS5 kökenli), eklendi. DS 7/DS 9 zaten sağlıklıydı. |
| cupra | ✅ Tamamlandı | Yeni marka (2018-), nesil geçmişi az. İlk Cupra modeli olan **Ateca (2018-2021, Seat Ateca tabanlı)** tamamen eksikti, eklendi. Born/Formentor/Leon/Tavascan/Terramar zaten sağlıklıydı. |
| smart | ✅ Tamamlandı | Fortwo (Türkiye'de yaygın şehir arabası) ve Forfour tek girişten gerçek nesillere bölündü (Fortwo 3 nesle: W450/W451/W453, Forfour 2 nesle: W454/W453). #1/#3 zaten sağlıklıydı. |
| tesla | ✅ Tamamlandı | Dosya zaten eksiksizdi (yeni marka, gerçek nesil geçmişi yok, facelift'ler Highland/Juniper zaten versiyonlarda mevcut). Değişiklik gerekmedi. |
| togg | ✅ Tamamlandı | WebSearch ile doğrulandı (Temmuz 2026) — Türkiye'de sadece T10X ve T10F satışta, yeni uygun fiyatlı model henüz gelmedi ("üzerinde çalışılıyor" aşamasında). Dosya zaten eksiksizdi, değişiklik gerekmedi. |
| byd | ✅ Tamamlandı | WebSearch ile doğrulandı — Türkiye'de Seal, **Sealion 7**, Han, Tang aktif satışta (Atto 3/Atto 2/Dolphin/Seal U geçici olarak satış dışı ama ikinci elde var, dokunulmadı). Sealion 7 tamamen eksikti, eklendi. |
| mg | ✅ Tamamlandı | WebSearch ile doğrulandı — Türkiye'de MG7, MG HS, MG ZS, MG4, Marvel R satışta. **MG7 tamamen eksikti** (orta segment sedan), eklendi. |
| haval | ✅ Tamamlandı | WebSearch ile Türkiye pazarı doğrulandı — Jolion, H6, H9 resmi/güncel fiyatlandırmayla teyit edildi, dosya zaten eksiksizdi. F7/F7x/Shenshou için güvenilir Türkiye kaynağı bulunamadı (Rusya pazarı modelleri gibi görünüyor), eklenmedi. |
| changan | ✅ Tamamlandı | Türkiye resmi fiyat listesi kaynağıyla doğrulandı — dosyada sadece CS55 Plus/UNI-K/UNI-V/Deepal S7 vardı, **Alsvin, CS15, CS35 Plus, CS55, Uni-T, X7 Plus tamamen eksikti**, eklendi (6 model). UNI-V ve Deepal S7'nin güncel satış durumu net doğrulanamadı, dokunulmadı (silinmedi). |

### Tier 3 — niş / lüks / az sayıda araç (son sıra)

| Marka | Durum | Not |
|---|---|---|
| porsche | ✅ Tamamlandı | En büyük eksiklik: dosyada sadece güncel nesiller vardı. 911 tek girişten 7 gerçek nesile bölündü (klasik 1965-1989, 964, 993, 996, 997, 991, 992). Boxster/Cayman tek girişten gerçek nesillere bölündü (986, 987, 981, 718=982). Cayenne 3 nesle bölündü (955/957, 92A, 2017-), Panamera 2 nesle bölündü (970, 971). Tamamen eksik klasik front-engine modeller eklendi: 924, 944, 928, 968. |
| maserati | ✅ Tamamlandı | **Quattroporte (marka bayrak gemisi sedan) tamamen eksikti** — 3 nesille eklendi (1994-2001, 2003-2012, 2013-2023). Biturbo (1982-1994, en yaygın klasik Maserati) ve 3200 GT/Coupé-Spyder (1998-2007) tamamen eksikti, eklendi. Ghibli/Levante/GranTurismo/GranCabrio/Grecale/MC20 (güncel dönem) zaten sağlıklıydı. |
| aston-martin | ✅ Tamamlandı | DB9/DB11/Vantage/DBS Superleggera/DBX zaten sağlıklıydı ama önceki nesiller eksikti. DB7 (1994-2003, DB9'un atası), Vanquish (2001-2007, ilk nesil V12 amiral gemisi), V8 Vantage (2005-2017, güncel Vantage'ın atası, ayrı isimle), Rapide (2010-2020, 4 kapılı), Vanquish (2012-2018, 2. nesil, DBS Superleggera'nın atası) tamamen eksikti, eklendi. |
| abarth | ✅ Tamamlandı | Dosya görece sağlıklıydı. Grande Punto (2008-2010) eksikti, "Punto (2010-2012)" → "Punto Evo (2010-2012)" olarak netleştirildi ve Grande Punto ayrı model olarak eklendi. Abarth 600e Türkiye'de henüz satışa çıkmadı (WebSearch ile doğrulandı, Temmuz 2026), eklenmedi. |
| alpine | ✅ Tamamlandı | Dosyada sadece 2017 sonrası relansman modelleri vardı (A110/A290). Klasik Alpine A110 (1961-1977, orijinal Berlinette, Renault-öncesi/dönemi ikonik model) tamamen eksikti, düşük güvenle eklendi (Türkiye'de çok nadir ama var). A310/GTA/A610 (1976-1995 Renault-Alpine dönemi) çok niş olduğu için kapsam dışı bırakıldı. |
| dodge | ✅ Tamamlandı | Büyük eksiklik: dosyada sadece güncel muscle-car nesiller vardı (Charger/Challenger/Durango 2011+), oysa Dodge'ın Türkiye'de resmi olarak satılan asıl modelleri tamamen eksikti — **Caliber (2006-2012), Avenger (2007-2010), Nitro (2007-2012), Journey (2008-2020)** eklendi (WebSearch ile resmi Türkiye lansmanı doğrulandı). Viper (1992-2017, ikonik V10, sınırlı sayıda resmi/paralel ithal) eklendi. |
| genesis | ✅ Tamamlandı | Dosya zaten eksiksizdi — G70/G80/G90/GV70/GV80 ve elektrikli versiyonlar Türkiye resmi Genesis distribütörü lansmanıyla uyumlu. Değişiklik gerekmedi. |
| infiniti | ✅ Tamamlandı | Zaten sağlıklıydı (Q30/Q50/Q60/Q70/QX70-FX, 2013-2019 Nissan-Renault Alliance Avrupa/Türkiye dönemi ile uyumlu). Değişiklik gerekmedi. |
| polestar | ✅ Tamamlandı | Zaten sağlıklıydı. Polestar 1 (2019-2022, sınırlı üretim) Türkiye'de hiç satılmadı, WebSearch ile doğrulandı, eklenmedi. |
| ora | ✅ Tamamlandı | Zaten sağlıklıydı (Funky Cat/Good Cat = GWM Ora 03, Lightning Cat). Değişiklik gerekmedi. |
| leapmotor | ✅ Tamamlandı | Zaten sağlıklıydı (T03/C10, Türkiye'ye yeni giren marka). Değişiklik gerekmedi. |
| diger.json | ⏭️ Atlanacak | Genel "Diğer" placeholder, denetime gerek yok |

**🎉 OTOMOBİL KATEGORİSİ TAMAMLANDI (51/51 marka).** Sırada: Motosiklet kategorisi (61 marka) — aşağıdaki listeyi doldur ve ilk markadan başla.

## Motosiklet (61 marka)

### Tier 1 — Türkiye'de en yaygın/çok satan (önce bunlar)

| Marka | Durum | Not |
|---|---|---|
| honda | ✅ Tamamlandı (2. tur, daha titiz) | Büyük eksiklik: **CG 125** (1976-2010, Türkiye'de Anadolu Honda tarafından 1992-2002 üretildi, dekadlarca en yaygın filo/esnaf motosikleti) tamamen eksikti, eklendi. Güncel resmi Türkiye fiyat listesiyle karşılaştırıldı: CB125F, Monkey, CL250, CB500 Hornet, CB750 Hornet, NX500, CRF250 Rally, CRF250L, SH125i, PCX125, EM1 e: (elektrikli scooter), Forza250, ADV350, XL750 Transalp, NT1100, GL1800 Gold Wing eklendi. **2. turda düzeltme:** PCX125 ilk taramada kaçmıştı (kullanıcı sorunca fark edildi) — artık her marka için hem fiyat listesi WebFetch'i hem de model-adı bazlı çapraz arama birlikte yapılıyor. |
| yamaha | ✅ Tamamlandı (2. tur, daha titiz) | 125cc segment sistematik eksikti — YZF-R125, MT-125, XSR125 eklendi. YZF-R25, NMAX155, XMAX250, Tricity155/300 eklendi. **2. turda ek bulgu:** klasik/komütasyon modelleri de eksikti — **YBR125** (CG125'in Yamaha karşılığı, çok yaygın komütasyon motoru) tamamen eksikti, Crypton 105, DT125 (klasik enduro), Virago XV (cruiser serisi) eklendi. |
| suzuki | ✅ Tamamlandı (2. tur, daha titiz) | **Hayabusa (GSX1300R, marka bayrak gemisi) tamamen eksikti**, eklendi. GSX-S125, GSX-8S, GSX-8R, GSX-S1000S Katana, V-Strom 800 DE, Burgman Street 125, Address 125, Avenis 125 eklendi. **2. turda ek bulgu:** Freewind XF650, GS500, Marauder VZ800 (klasik/ikinci el yaygın modeller) tamamen eksikti, eklendi. |
| kawasaki | ✅ Tamamlandı | **KLR 650 Türkiye'de 1987-2004 arası Otosan tarafından resmi satıldı** (2022'de yeni nesille geri döndü) — her ikisi de tamamen eksikti, eklendi. ER-5 (1997-2006, bütçe twin), Eliminator (yeni cruiser/naked), KLX250, Versys-X300 eklendi. |
| bmw | ✅ Tamamlandı | R1100GS (1994-1999) ve R1150GS (1999-2004, R1200GS'in atası, yaygın ikinci el) tamamen eksikti, eklendi. R nineT (heritage roadster ailesi) ve F650 (1993-2007, çok yaygın funduro) tamamen eksikti, eklendi. |
| ktm | ✅ Tamamlandı | 200 Duke, 690 Duke, 990 Duke (2005-2013), 200 RC, 690 Enduro R, Adventure 950/990 (2003-2013, güncel 890/1290'un atası) tamamen eksikti, eklendi. |
| piaggio | ✅ Tamamlandı | Resmi Türkiye fiyat listesiyle karşılaştırıldı: **Beverly (200/300/400, "high-wheel" segment lideri) tamamen eksikti**, eklendi. Piaggio One (yeni elektrikli scooter) eklendi. MP3 300 → MP3 310 güncel isimlendirmeye taşındı. |
| vespa | ✅ Tamamlandı | **PX 125/150/200 (1977-2007 klasik largeframe + 2011'de yeniden üretime alındı, Türkiye'de çok yaygın ikinci el klasik) tamamen eksikti**, eklendi. 946 (premium sınırlı seri hattı) eklendi. |
| bajaj | ✅ Tamamlandı | Resmi Türkiye distribütörü (eKuralkan) fiyat listesiyle karşılaştırıldı — güncel nesil **Pulsar N160/N250 isimlendirmesi eksikti**, eklendi. Diğer modeller (Dominar, Avenger, RS200) zaten sağlıklıydı. |
| tvs | ✅ Tamamlandı | Resmi Türkiye fiyat listesi (turkiye.tvsmotor.com) ile karşılaştırıldı — güncel satışta olan **Raider, Jupiter 125 tamamen eksikti**, eklendi. Ayrıca resmi ürün sayfası doğrulamasıyla **NTorq 125 RE** (2023-, satışta olduğu ayrı sayfadan teyit edildi ama fiyat listesinde görünmüyordu) eklendi. Apache RR 310 ve Ronin 225 güncel resmi fiyat listesinde yok (muhtemelen üretimden kalktı/ithalat durdu) ama ikinci elde var olabileceğinden dosyadan silinmedi.
| kymco | ✅ Tamamlandı | Dosyada sadece 5 eski model vardı (AK 550, Downtown 350, Xciting S 400, Agility 125, Like 125). Resmi kymco.com.tr fiyat listesiyle karşılaştırıldı — **çok sayıda güncel/yeni nesil model tamamen eksikti**: Downtown GT 350, Xciting VS 400, Agility S 125i, Sky Town 125, DTX 350/250, Downtown 250i, X-Town CT 250, KRV 200, People S 200, Dink R 150, Micare 125, CV3, MXU 550i EPS/300i (ATV), I-One (elektrikli). Eski modeller (Like 125, Agility 125, Downtown 350, Xciting S 400) ikinci elde olabileceğinden silinmedi. |
| mondial-tr | ✅ Tamamlandı | Yerli üretim/distribütör — **büyük eksiklik**: dosyada sadece iki generic girdi vardı ("125 Retro/Classic", "250 Retro/Classic"), bunlar gerçek model isimleriyle örtüşmüyordu. Gerçek klasik/nostalji 125cc hattı (MG Classic/Deluxe/Sport, NT, ZN/ZNU Nostalji, Elegante) ve 250cc modeller (Nevada V-twin cruiser, Ressivo naked) doğru isimleriyle eklendi. Resmi mondialmotor.com.tr fiyat listesiyle güncel scooter/moped/cross hattı da eklendi (Exon 50/125, Wing/Turismo/Rio 50, ZNU i, UAG, Fury 110i, Lavinia Pro, Lungo/Fuzion 125, Velomax, Drift L, SFC Mini 50, Cross X-Treme Maxx 200i). Sitedeki "E-BIKE" (pedal destekli elektrikli bisiklet) bölümü kapsam dışı bırakıldı — o kategori e-bisiklet denetiminde ayrıca kontrol edilmeli. |
| umit-motor | ❌ Kaldırıldı | Gerçek bir motosiklet üreticisi olduğu doğrulanamadı. WebSearch/WebFetch ile araştırıldı — "Ümit" adıyla bulunan tek şeyler çocuk oyuncak scooter/bisiklet markası (Ümit Bisiklet) ve alakasız bir oto servis (Ümit Otomotiv, Mersin/Bolu) idi. sahibinden.com WebFetch ile 403 (bot koruması) verdiği için erişilemedi, kullanıcı kendisi sahibinden'de aradı ve bulamadığını doğruladı. Dosya (`umit-motor.json`) silindi, `vehicles.json` merge ile güncellendi (motosiklet 62→61 marka). |
| kuba-motor | ✅ Tamamlandı | sahibinden.com'da gerçek kategori sayfası olduğu doğrulandı (yerli üretici, kubamotor.com.tr). Dosyada 3 generic girdi vardı, resmi fiyat listesiyle karşılaştırılınca **~35 model tamamen eksikti** (Touring/Scooter/Cub/Klasik/Chopper/Cross/Ticari/Off Road/T1-T3 segmentleri) — E-Scooter (kick scooter) ve E-Car segmentleri kapsam dışı bırakıldı (motosiklet değil). |
| regal-raptor | ✅ Tamamlandı | Resmi regalraptor.com.tr model sayfasıyla karşılaştırıldı — dosyadaki eski 350cc DD/Spyder/Bobber serisi güncel lineup'ta yoktu (silinmedi, ikinci el için kalabilir), güncel model serisi (Cafe Racer/Classic/Daytona/Pilder 125-250, Max/XSUV/SPN/Shark, ATV serisi M210/F320/Promax, Stellino 50 elektrikli) tamamen eksikti, eklendi. |
| sym | ✅ Tamamlandı | Resmi sym-tr.com fiyat listesiyle karşılaştırıldı — dosyada 4 model vardı, güncel 125-500cc lineup'ının çoğu eksikti (Fiddle IV, X'Pro, NHX, Dragon 160, Mamba 160, Symphony ST 200, NHT 200, Joymax Z 250, ADX 300, Joyride 300, Maxsym 508), eklendi. |
| keeway | ✅ Tamamlandı | Resmi distribütör sitesi (keeway.com.tr) güncel değildi (2020 verisi gösteriyordu), forum/haber kaynaklarıyla çapraz kontrol edildi — **RK 125 E, RKF 125, Sixties 300i, V302N Streetfighter, Versilia 125** (2024 model yılı) eksikti, eklendi. Not: Superlight serisi artık Kuba markası altında, 250cc V-twin modeller RKS markası altında Türkiye'ye geliyor — marka karışıklığı riski var, ileride Kuba/RKS denetiminde tekrar kontrol edilmeli. |

**🎉 MOTOSİKLET TIER 1 TAMAMLANDI (Ümit Motor hariç, doğrulanamadığı için kaldırıldı).** Sırada Tier 2 — Triumph'tan başla.

### Tier 2 — orta yaygınlık / tanınmış

| Marka | Durum | Not |
|---|---|---|
| triumph | ✅ Tamamlandı | Güncel lineup eksikleri eklendi (Tiger Sport 660/800, Trident 800, Thruxton 400, Street Tracker 400, Bonneville Bobber/Speedmaster, Scrambler 900/1200). Klasik/discontinued modeller eklendi: Daytona (2004-2017), Tiger 800 (2010-2020, Tiger 900'ün öncülü), Sprint ST/RS, America/Speedmaster (2003-2017 cruiser), Thunderbird. |
| ducati | ✅ Tamamlandı | Güncel lineup eksikleri eklendi: DesertX (tamamen eksikti), Streetfighter V2, Multistrada V2. Klasik superbike lineage tamamen eksikti: 748/916/996/998/999, SuperSport 600SS/750SS/900SS/1000SS. Ayrıca Monster 600-1000 (eski nesil, mevcut 696/796'dan ayrı), ST2/ST3/ST4 sport tourer, Multistrada 1000DS/1100 eklendi. |
| harley-davidson | ✅ Tamamlandı | Güncel lineup eksikleri eklendi: Nightster/Nightster Special, Street Bob, Low Rider S/ST, Road Glide, Tri Glide. Klasik/discontinued eklendi: Dyna serisi (1991-2017, mevcut Softail-tabanlı Fat Bob/Street Bob'dan ayrı), Sportster 883/1200 Custom (klasik isimlendirme), V-Rod. |
| royal-enfield | ✅ Tamamlandı | Güncel Türkiye lineup'ı (K-Rides/Kibar distribütörlüğü) eksikti — Super Meteor 650, Shotgun 650, Bear 650, Guerrilla 450, Scram 411, Classic 500, Bullet 500 (Trials), eski Continental GT 535 eklendi. |
| benelli | ✅ Tamamlandı | Güncel lineup eksikleri eklendi: TRK 251, Leoncino 250, Imperiale 400, 249S, BN 251. Klasik/discontinued TNT 899/1130 ve Tornado Tre 1130 (marka bayrak gemisi süperbike) tamamen eksikti, eklendi. |
| cf-moto | ✅ Tamamlandı | Güncel lineup'ta 250NK/250SR/450NK/450MT/450SR/450CL-C/675SR tamamen eksikti (dosyada sadece 150-800cc arası eski nesil vardı), eklendi. |
| aprilia | ✅ Tamamlandı | RS 457/Tuono 457 (yeni A2 segment) eksikti. Klasikler eklendi: RSV Mille (1998-2004, marka bayrak gemisi), Shiver 750/SL750, Scarabeo 200/500 scooter, Mana 850 GT (otomatik). |
| mv-agusta | ✅ Tamamlandı | Dragster 800 (RR/RC), Rush 1000, Enduro Veloce güncel modelleri eksikti. **F4 (1998-2018, marka bayrak gemisi süperbike) tamamen eksikti**, eklendi. |
| husqvarna | ✅ Tamamlandı | Dosyada sadece cadde (street) modelleri vardı, **tüm enduro/motokros off-road lineup'ı (TE/FE/FC/TC serileri) tamamen eksikti** — Türkiye'de Husqvarna'nın güçlü olduğu segment. Vitpilen 125/Svartpilen 250/Svartpilen-Vitpilen 801/701 Supermoto de eklendi. |
| peugeot-motorcycles | ✅ Tamamlandı | Pulsion/Pulsion Evo ve XP400 SUV (maxi-scooter) güncel modelleri eksikti, eklendi. |
| gas-gas | ✅ Tamamlandı | Dosyada sadece EC/MC/ES/SM kategorileri vardı, **TXT (Trial) kategorisi tamamen eksikti** — GasGas'ın tarihsel olarak en güçlü olduğu segment, eklendi. |
| fb-mondial | ✅ Tamamlandı | İtalyan FB Mondial (Türkiye'de niş/az sayıda ithal, mondial-tr'den [Mondial Motor TR] ayrı marka) — Imola ve Flat Track modelleri eksikti, eklendi. |
| hero | ✅ Tamamlandı | Türkiye'de sadece 3 model resmi satışta (Dash 110/125, Xpulse 200 4V) ama ikinci elde Karizma/Hunk/Pleasure/Duet 110 de yaygın — eklendi. |
| moto-guzzi | ✅ Tamamlandı | Klasik nameplate'ler tamamen eksikti: California, Griso, Nevada, Breva, Norge, V11 Sport eklendi. |
| indian | ✅ Tamamlandı | Resmi indianmotorcycle.com.tr sitesiyle karşılaştırıldı — Chieftain, Roadmaster, Pursuit (Bagger/Touring aile) tamamen eksikti, eklendi. Springfield (discontinued ama ikinci elde yaygın) ve Chief Vintage eklendi. |
| voge | ✅ Tamamlandı | Resmi vogeturkiye.com.tr fiyat listesiyle karşılaştırıldı — lineup büyük ölçüde yenilenmiş (SR serisi scooter, 250RR/RR525, DS625X/DS900X, R125, AC525X), eski nesil isimlerin (300AC/500AC/650AC) yanına yeni resmi modeller eklendi. |
| qjmotor | ✅ Tamamlandı | SRT550/SRT550 X, SVT650 X, SRT800 X (adventure ailesi) eksikti, eklendi. |
| zontes | ✅ Tamamlandı | Resmi zontesturkiye.com fiyat listesindeki güncel nesil (ZT200C, ZT250T-E/G, ZT350T2/R1/V1, ZT368G/T-G) eski nesil isimlerden (Z125/Z250/ZT310/ZT350-T) farklı çıktı, yeni modeller eklendi. |
| lifan | ✅ Tamamlandı | Resmi lifanmotor.com.tr listesiyle karşılaştırıldı — KPV 150, K29, V16, KPS 250, KPT 400 (güncel resmi lineup) eksikti, eklendi. |

### Tier 3 — niş / elektrikli / az sayıda araç (son sıra)

| Marka | Durum | Not |
|---|---|---|
| beta | ✅ Tamamlandı | **Evo (Trial) kategorisi tamamen eksikti** — Beta'nın Trial/Enduro/Street üç ana ailesinden biri, dosyada sadece RR Enduro/Motard/Xtrainer vardı, eklendi. |
| sherco | ✅ Tamamlandı | **ST (Trial) kategorisi tamamen eksikti** — dosyada sadece Enduro/Supermoto vardı, eklendi. |
| rieju | ✅ Tamamlandı | MRT 125 (naked/enduro) eksikti, eklendi. Dosya zaten görece kapsamlıydı. |
| fantic | ✅ Tamamlandı | Korlas (resmi distribütör) sitesiyle doğrulandı — XEF 250/450 (4T Enduro) eksikti, eklendi. |
| jawa | ✅ Tamamlandı | Resmi jawa.com.tr (Blue Motor distribütörlüğü) ile karşılaştırıldı, dosya zaten (42/Perak/350 OHC) eksiksizdi, değişiklik gerekmedi. |
| ural | ✅ Tamamlandı | Resmi uralmotosiklet.com (Restar distribütörlüğü) ile karşılaştırıldı — Türkiye'de satılan 4 model isminden (T/Sportsman/Ranger/Retro) sadece 2'si (Gear Up/CT, farklı isimlendirme) vardı, Ranger/Sportsman/Retro eklendi. |
| norton | ✅ Tamamlandı | Çok niş (Türkiye'de resmi distribütör yok, sadece ikinci el birkaç adet) — Superlight SS, Dominator eklendi. |
| buell | ✅ Tamamlandı | Ulysses XB12X (adventure, tanınan model) eksikti, eklendi. |
| bimota | ✅ Tamamlandı | Çok niş (Türkiye'de resmi satış yok) — dosyada sadece Kawasaki motorlu KB4/Tesi H2 vardı, markanın tarihsel ana hattı olan **Ducati motorlu DB serisi (DB5-DB9) ve klasik Tesi tamamen eksikti**, eklendi. |
| moto-morini | ✅ Tamamlandı | Korlas (resmi distribütör) ile doğrulandı — Corsaro (marka flagship naked), X-Cape 700, 3½ (Trepuntocinque, retro) eksikti, eklendi. |
| motron | ✅ Tamamlandı | Türkiye'de doğrulanabilir ikinci el/distribütör izi bulunamadı, dosya (Cubertino/X-Pace/Unplugged) değiştirilmedi. |
| orcal | ✅ Tamamlandı | Fransız niş marka, Türkiye'de Astor/Sprint 125 dışında doğrulanabilir ek model bulunamadı, değişiklik gerekmedi. |
| mash | ✅ Tamamlandı | Mondial Motor distribütörlüğü doğrulandı — X-Ride (125/650) eksikti, eklendi. |
| kanuni | ✅ Tamamlandı | Yerli üretici, gerçek marka doğrulandı (1987'den beri, Tuzla fabrikası, Wikipedia). Dosyada generic placeholder vardı ("Motosiklet 50/100/125", "Scooter 50/125") — gerçek model isimleriyle (Trodon XS, Tigrina, Puma 150, Nev 50) değiştirildi. |
| cag | ❌ Kaldırıldı | Araştırıldı, gerçek bir motosiklet üreticisi bulunamadı — "Çağ Motor" adıyla bulunan tek işletme Ankara Ostim'de bir motor tamir/yenileme atölyesi (1986), motosiklet üretmiyor. Ümit Motor ile aynı desen. Kullanıcıya soruldu, kaldırılması onaylandı — `cag.json` silindi. |
| arora | ✅ Tamamlandı | Yerli marka, gerçekliği doğrulandı (motoron.com.tr 2026 fiyat listesi). Dosyada generic placeholder vardı, gerçek model isimleriyle (Freedom 50, Dazzle 50, Jaguar 125, AR 125/251, GS 525, CK 250, Supersport GP250, Angel Pro vb.) değiştirildi. |
| asya | ✅ Tamamlandı | Yerli üretici, gerçekliği doğrulandı (Nazilli/Aydın fabrikası, 2004'ten beri, Wikipedia). Dosyada generic placeholder vardı, gerçek model isimleriyle (Nostalji 125, Thunder, SkyMax/Pro, Bubbly, T-Rex, Turkcup, Ultra 150, Polo vb.) değiştirildi. Not: Asya Motor ayrıca Daelim'in Türkiye distribütörü ve Quswa markasının sahibi — bunlar ayrı marka dosyaları olarak ele alınmalı, karıştırılmamalı. |
| colove | ✅ Tamamlandı | Muhtemelen "Kove" (Çinli üretici, kovemoto.com.tr resmi distribütörü) markasının bu veri setindeki yazımı — 800X Pro/800X Rally eksikti, eklendi. Marka adı riski not düşüldü: gelecekte "kove" adıyla ayrı bir dosya oluşturulursa mükerrerlik kontrol edilmeli. |
| energica | ✅ Tamamlandı | Resmi Türkiye distribütörü doğrulandı (Ankara), dosya (Ego/Eva Ribelle/Experia) zaten eksiksizdi. |
| zero-motorcycles | ✅ Tamamlandı | Resmi Türkiye distribütörü doğrulandı (İmecar Otomotiv, Antalya), dosya zaten eksiksizdi. |
| stark-future | ✅ Tamamlandı | Resmi Türkiye distribütörü doğrulandı (Uzun Moto) — Varg SM (Supermoto) eksikti, eklendi. |
| silence | ✅ Tamamlandı | Resmi distribütör doğrulandı (Doğan Trend Otomobilite) — **S02 tamamen eksikti** (dosyada sadece S01 vardı), eklendi. |
| super-soco | ✅ Tamamlandı | Resmi lineup (TC/TC Max/CUx/CPx) ile karşılaştırıldı, dosya zaten eksiksizdi. |
| sur-ron | ✅ Tamamlandı | Resmi sur-ron.com.tr ile karşılaştırıldı (Light Bee X/Ultra Bee/Storm Bee), dosya zaten eksiksizdi. |
| brixton | ✅ Tamamlandı | Resmi distribütör doğrulandı (Isotlar Motor) — Crossfire 125/500 (Scrambler ailesi) ve Sunray 125 tamamen eksikti, eklendi. |

**🎉 MOTOSİKLET KATEGORİSİ TAMAMLANDI (61/61 marka), 2 Temmuz 2026.** Tier 1 (17), Tier 2 (18), Tier 3 (26) hepsi bitti; Çağ markası doğrulanamadığı için kaldırıldı (Ümit Motor ile aynı desen — motosiklet kategorisinde artık 60 gerçek marka var). Sırada: Kamyonet kategorisi (31 marka) — aşağıya tier listesi eklenip ilk markadan başlanmalı.
| diger.json | ⏭️ Atlanacak | Genel "Diğer" placeholder, denetime gerek yok |

## Kamyonet (30 marka)

### Tier 1 — Türkiye'de en yaygın pickup/hafif ticari (önce bunlar)

| Marka | Durum | Not |
|---|---|---|
| ford | ✅ Tamamlandı | Resmi ford.com.tr ticari araç listesiyle karşılaştırıldı — Ranger, Transit (Kamyonet/Van/Custom/Connect), Tourneo (Custom/Connect), Courier, E-Transit zaten dosyada mevcuttu. Değişiklik gerekmedi. |
| toyota | ✅ Tamamlandı | Resmi toyota.com.tr ile karşılaştırıldı — Hilux (3 nesil), Proace, Proace City, Land Cruiser Pickup zaten dosyada mevcuttu. Değişiklik gerekmedi. |
| volkswagen | ✅ Tamamlandı | Resmi ticariarac.vw.com.tr ile karşılaştırıldı — **ID. Buzz (elektrikli van) tamamen eksikti**, eklendi. Grand California (karavan kategorisinde ayrıca kontrol edilmeli) kapsam dışı bırakıldı. Caddy/Transporter/Caravelle/Multivan/Crafter/Amarok zaten sağlıklıydı. |
| isuzu | ✅ Tamamlandı | D-Max trim isimleri güncel resmi isimlendirmeye (V-Life/V-Joy/V-Cross) güncellendi, eski "LSX" kaldırıldı. N-Series/F-Series (kamyon ailesi) zaten mevcuttu, kamyon/otobüs (Novo/Turkuaz/Visigo) kapsam dışı bırakıldı. |
| mitsubishi | ✅ Tamamlandı | **Yeni nesil L200 (2024-, Tornado/Storm/Blizzard/Premium/Crawler donanımları) eksikti**, L200 (2015-) ikiye bölündü: 2015-2024 ve 2024-. L300/Canter zaten sağlıklıydı. |
| fiat | ✅ Tamamlandı | **Qubo (Fiorino'nun yolcu versiyonu) yanlışlıkla Fiorino'nun trim'i olarak listelenmişti**, ayrı model olarak düzeltildi. **Ulysse (Scudo tabanlı büyük MPV) tamamen eksikti**, eklendi. Fullback (L200 rebadge) Türkiye'de resmi satılmadığı için eklenmedi. Doblo/Ducato/Scudo/Talento zaten sağlıklıydı. |
| renault | ✅ Tamamlandı | Resmi renault.com.tr ile karşılaştırıldı — Kangoo/Express/Trafic/Master zaten sağlıklıydı. Alaskan'ın Türkiye resmi satış durumu net doğrulanamadı ama zararsız olduğu için dosyada bırakıldı. Değişiklik gerekmedi. |
| peugeot | ✅ Tamamlandı | Partner/Expert/Traveller/Boxer zaten sağlıklı ve gerçek nesillere bölünmüştü (Citroën kamyonet dosyasıyla aynı desen). Değişiklik gerekmedi. |
| citroen | ✅ Tamamlandı | Berlingo/Nemo/Jumpy/SpaceTourer/Jumper zaten sağlıklı ve gerçek nesillere bölünmüştü. Değişiklik gerekmedi. |
| mercedes-benz | ⬜ Bekliyor | |
| hyundai | ⬜ Bekliyor | |
| karsan | ⬜ Bekliyor | Yerli üretici |

### Tier 2 — orta yaygınlık

| Marka | Durum | Not |
|---|---|---|
| nissan | ⬜ Bekliyor | |
| opel | ⬜ Bekliyor | |
| kia | ⬜ Bekliyor | |
| dacia | ⬜ Bekliyor | |
| iveco | ⬜ Bekliyor | |
| ram | ⬜ Bekliyor | |
| gwm | ⬜ Bekliyor | |
| bmc | ⬜ Bekliyor | Yerli üretici (kamyon ağırlıklı) |

### Tier 3 — niş / az sayıda araç (son sıra)

| Marka | Durum | Not |
|---|---|---|
| byd | ⬜ Bekliyor | |
| dfsk | ⬜ Bekliyor | |
| foton | ⬜ Bekliyor | |
| fuso | ⬜ Bekliyor | |
| hino | ⬜ Bekliyor | |
| ineos | ⬜ Bekliyor | |
| maxus | ⬜ Bekliyor | |
| tata | ⬜ Bekliyor | |
| diger.json | ⏭️ Atlanacak | Genel "Diğer" placeholder |

## E-Scooter (21 marka)

_Sırada._

## E-Bisiklet (40 marka)

_Sırada._

## Karavan (32 marka)

_Sırada._

---

## Genel notlar / karar kayıtları

- **✅ ÇÖZÜLDÜ (commit 9257e78) — "Diğer" model fallback eksikliği:** 47 marka dosyasında (otomobil 23, motosiklet 16, kamyonet 8) model listesinde "Diğer" seçeneği hiç yoktu. `src/app/oner/page.tsx:72` `selectedModel === "Diğer"` kontrolüne bağımlı — eksik olduğunda kullanıcı aracını bulamazsa serbest metin girişine geçemiyordu (gerçek fonksiyonel bug, sadece veri kalitesi değil). Otomatik script ile tüm eksik dosyalara mekanik olarak eklendi, `merge.ts` çalıştırıldı, `vehicles.json` güncellendi. **Bu kontrolü tekil marka denetimlerinde artık tekrar yapmaya gerek yok.**
- **Tekrar eden desen — yerli üretim/klasik modeller eksik:** Honda, Renault, Fiat'ta Türkiye'ye özgü klasik/tarihsel modeller (Renault 12 Toros, Tofaş Doğan/Şahin/Kartal gibi) sistematik olarak eksikti. Devam eden markalarda (özellikle Türkiye'de üretim geçmişi olanlar: Ford Otosan, Toyota Adapazarı, Hyundai Assan vb.) aynı kontrolü yap.
