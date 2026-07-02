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
| audi | ⬜ Bekliyor | |
| nissan | ⬜ Bekliyor | |
| mazda | ⬜ Bekliyor | |
| suzuki | ⬜ Bekliyor | |
| seat | ⬜ Bekliyor | |
| jaecoo | ⬜ Bekliyor | Chery grubu, yeni ama Türkiye'de hızla yaygınlaştı |
| omoda | ⬜ Bekliyor | Chery grubu, yeni ama Türkiye'de hızla yaygınlaştı |

### Tier 2 — orta yaygınlık / premium ama tanıdık

| Marka | Durum | Not |
|---|---|---|
| volvo | ⬜ Bekliyor | |
| mini | ⬜ Bekliyor | |
| jeep | ⬜ Bekliyor | |
| subaru | ⬜ Bekliyor | |
| mitsubishi | ⬜ Bekliyor | |
| land-rover | ⬜ Bekliyor | |
| jaguar | ⬜ Bekliyor | |
| lexus | ⬜ Bekliyor | |
| alfa-romeo | ⬜ Bekliyor | |
| ds | ⬜ Bekliyor | |
| cupra | ⬜ Bekliyor | |
| smart | ⬜ Bekliyor | |
| tesla | ⬜ Bekliyor | |
| togg | ⬜ Bekliyor | |
| byd | ⬜ Bekliyor | |
| mg | ⬜ Bekliyor | |
| haval | ⬜ Bekliyor | |
| changan | ⬜ Bekliyor | |

### Tier 3 — niş / lüks / az sayıda araç (son sıra)

| Marka | Durum | Not |
|---|---|---|
| porsche | ⬜ Bekliyor | |
| maserati | ⬜ Bekliyor | |
| aston-martin | ⬜ Bekliyor | |
| abarth | ⬜ Bekliyor | |
| alpine | ⬜ Bekliyor | |
| dodge | ⬜ Bekliyor | |
| genesis | ⬜ Bekliyor | |
| infiniti | ⬜ Bekliyor | |
| polestar | ⬜ Bekliyor | |
| ora | ⬜ Bekliyor | |
| leapmotor | ⬜ Bekliyor | |
| diger.json | ⏭️ Atlanacak | Genel "Diğer" placeholder, denetime gerek yok |

## Motosiklet (61 marka)

_Otomobil bitince listelenecek._

## Kamyonet (30 marka)

_Sırada._

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
