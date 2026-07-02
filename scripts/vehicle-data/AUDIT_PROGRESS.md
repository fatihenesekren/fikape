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
| opel | ⬜ Bekliyor | |
| peugeot | ⬜ Bekliyor | |
| citroen | ⬜ Bekliyor | |
| dacia | ⬜ Bekliyor | |
| kia | ⬜ Bekliyor | |
| skoda | ⬜ Bekliyor | |
| mercedes-benz | ⬜ Bekliyor | |
| bmw | ⬜ Bekliyor | |
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
