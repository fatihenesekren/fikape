# Araç Veri Denetimi — İlerleme Takibi

**Amaç:** `scripts/vehicle-data/<kategori>/<marka>.json` dosyalarındaki model/nesil/versiyon/trim bilgilerini gerçek Türkiye pazar verisiyle karşılaştırıp eksik/hatalı olanları düzeltmek (örn. Honda Jazz'da eksik nesiller).

**Yöntem:** Her marka için her model, web aramasıyla gerçek nesil/versiyon/trim listesiyle karşılaştırılır. Eksik nesil eklenir, versiyon/trim listeleri güncellenir. Kaydedilen her marka commit edilir.

**Devam etme kuralı:** Bu dosyadaki "Bekliyor" (⬜) durumundaki ilk markadan devam et. Kategori sırası: otomobil → motosiklet → kamyonet → e-scooter → e-bisiklet → karavan.

---

## Otomobil (51 marka)

| Marka | Durum | Not |
|---|---|---|
| honda | ✅ Tamamlandı | Jazz: 4 nesil eklendi (2002-2008 ES/LS/Elite/Sport, 2008-2015 Fun/Joy, 2015-2020 Dream PE/Premium/Elegance, 2020- Elegance/Advance/Crosstar). HR-V: 1999-2006 ilk nesil eklendi (trim isimleri belirsiz, generic "Standart/4WD" kullanıldı — düşük güven). CR-V: tek nesil yerine 5 nesile bölündü (2002-2006, 2007-2012, 2012-2018, 2018-2023, 2023-). Civic/ZR-V/Accord/e zaten sağlıklıydı, dokunulmadı. |
| abarth | ⬜ Bekliyor | |
| alfa-romeo | ⬜ Bekliyor | |
| alpine | ⬜ Bekliyor | |
| aston-martin | ⬜ Bekliyor | |
| audi | ⬜ Bekliyor | |
| bmw | ⬜ Bekliyor | |
| byd | ⬜ Bekliyor | |
| changan | ⬜ Bekliyor | |
| citroen | ⬜ Bekliyor | |
| cupra | ⬜ Bekliyor | |
| dacia | ⬜ Bekliyor | |
| dodge | ⬜ Bekliyor | |
| ds | ⬜ Bekliyor | |
| fiat | ⬜ Bekliyor | |
| ford | ⬜ Bekliyor | |
| genesis | ⬜ Bekliyor | |
| haval | ⬜ Bekliyor | |
| hyundai | ⬜ Bekliyor | |
| infiniti | ⬜ Bekliyor | |
| jaecoo | ⬜ Bekliyor | |
| jaguar | ⬜ Bekliyor | |
| jeep | ⬜ Bekliyor | |
| kia | ⬜ Bekliyor | |
| land-rover | ⬜ Bekliyor | |
| leapmotor | ⬜ Bekliyor | |
| lexus | ⬜ Bekliyor | |
| maserati | ⬜ Bekliyor | |
| mazda | ⬜ Bekliyor | |
| mercedes-benz | ⬜ Bekliyor | |
| mg | ⬜ Bekliyor | |
| mini | ⬜ Bekliyor | |
| mitsubishi | ⬜ Bekliyor | |
| nissan | ⬜ Bekliyor | |
| omoda | ⬜ Bekliyor | |
| opel | ⬜ Bekliyor | |
| ora | ⬜ Bekliyor | |
| peugeot | ⬜ Bekliyor | |
| polestar | ⬜ Bekliyor | |
| porsche | ⬜ Bekliyor | |
| renault | ⬜ Bekliyor | |
| seat | ⬜ Bekliyor | |
| skoda | ⬜ Bekliyor | |
| smart | ⬜ Bekliyor | |
| subaru | ⬜ Bekliyor | |
| suzuki | ⬜ Bekliyor | |
| tesla | ⬜ Bekliyor | |
| togg | ⬜ Bekliyor | |
| toyota | ⬜ Bekliyor | |
| volkswagen | ⬜ Bekliyor | |
| volvo | ⬜ Bekliyor | |
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

- (Henüz yok — düzeltmeler ilerledikçe buraya tekrar eden hata kalıpları eklenecek.)
