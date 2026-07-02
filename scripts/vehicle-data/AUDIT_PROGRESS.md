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
| volkswagen | ⬜ Bekliyor | |
| ford | ⬜ Bekliyor | |
| toyota | ⬜ Bekliyor | |
| hyundai | ⬜ Bekliyor | |
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
