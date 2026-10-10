import {
  MOTO_TYPES, OTOMOBIL_BODY_TYPES, OTOMOBIL_SEGMENTS, KAMYONET_BODY_TYPES,
  KAMYONET_CAB_TYPES, KAMYONET_CHASSIS_LENGTHS, KAMYONET_ROOF_HEIGHTS,
  KAMYONET_REAR_DOORS, KAMYONET_4WD_TYPES, TRANSMISSION_TYPES,
  KARAVAN_TYPES, BIKE_TYPES, EBIKE_MOTOR_TYPES, PEDELEC_CLASSES, DRIVETRAIN_TYPES,
  HEATING_TYPES, KARAVAN_ALT_TIPLERI, KARAVAN_ALT_TIP_GRUBU, KARAVAN_TOILET_TYPES,
  KARAVAN_LICENSE_CLASSES, KARAVAN_BRAKE_SYSTEMS, KARAVAN_FUEL_TYPES,
} from "@/lib/vehicleTypes";

// showIf: alan sadece diğer alanların (ör. fuel_type) mevcut değerine göre
// anlamlıysa gösterilir — ör. "Çıkarılabilir Batarya" benzinli bir motosiklette
// hiç anlamlı değil, sadece elektrikli motosikletlerde sorulmalı/gösterilmeli
// (bkz. kullanıcı geri bildirimi: benzinli XMAX 250'de bu alan yanlışlıkla
// "Yok" olarak gösteriliyordu).
type ShowIf = (attrs: Record<string, string>) => boolean;

export type FieldDef =
  | { key: string; label: string; type: "number"; unit?: string; placeholder?: string; note?: string; showIf?: ShowIf }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; showIf?: ShowIf }
  | { key: string; label: string; type: "boolean"; showIf?: ShowIf }
  | { key: string; label: string; type: "text"; placeholder?: string; showIf?: ShowIf };

const isElectricMoto: ShowIf = (a) => a.fuel_type === "EV";

// Otomobil: EV/PHEV/HYBRID araçlarda gerçek bir çekiş bataryası+elektrikli
// menzil vardır (PHEV'de bu tamamen gerçek bir spesifikasyon — bkz. BYD Seal
// PHEV örneği, battery_kwh=18.3 doğru veri), sadece saf benzin/dizel/LPG'de
// anlamsız. Motor hacmi+yakıt deposu ise tam tersi: sadece SAF EV'de (içten
// yanmalı motoru hiç olmayan) anlamsız, PHEV/HYBRID'de ikisi de gerçek.
const hasElectricRange: ShowIf     = (a) => a.fuel_type === "EV" || a.fuel_type === "PHEV" || a.fuel_type === "HYBRID";
const hasCombustionEngine: ShowIf  = (a) => a.fuel_type !== "EV";

// Karavan: motor/vites bilgisi sadece motorlu/kamper-van tiplerinde var —
// "Çekme" karavanın kendi motoru yok (bkz. CROSS_FIELD_RULES'daki aynı kural,
// orada sadece UYARI veriyordu, burada showIf ile alan hiç gösterilmiyor).
const isMotorizedKaravan: ShowIf = (a) => a.karavan_type !== "cekme";
// Çekme karavana özel (tip boşsa sorulur): aks, çeki oku yükü, fren, stabilizatör.
const isCekmeKaravan: ShowIf = (a) => !a.karavan_type || a.karavan_type === "cekme";
// Yükselen çatı yalnız kamper van'da anlamlı.
// Katlanır bisiklet (ya da tip henüz seçilmemiş): katlanmış ölçü sorulur.
const isFoldingBike: ShowIf = (a) => !a.bike_type || a.bike_type === "katlanabilir";
const isKamperVan: ShowIf = (a) => !a.karavan_type || a.karavan_type === "kamper-van";

// Kamyonet: kabin konfigürasyonu yalnız pickup kasa tipinde anlamlı —
// van/panelvan/minivan'da "kaç kapı/kabin" ayrı bir kavram değil.
// Kasa henüz seçilmemişse (body_type boş) alanlar gösterilir/Gemini'ye sorulur;
// seçilince yalnız o kasaya uygun olanlar kalır.
const kasaBos = (a: Record<string, string>) => !a.body_type;
const isPickupBody: ShowIf = (a) => kasaBos(a) || a.body_type === "pickup";
const isVanBody: ShowIf = (a) => kasaBos(a) || a.body_type === "van" || a.body_type === "panelvan";
// Bagaj (L): yolcu odaklı minivan ve camlı vanda (kargo m³ yerine).
const isMinivanBody: ShowIf = (a) => kasaBos(a) || a.body_type === "minivan" || a.body_type === "camli_van";
const hasSeatCount: ShowIf = (a) => kasaBos(a) || a.body_type === "van" || a.body_type === "panelvan" || a.body_type === "minivan" || a.body_type === "minibus" || a.body_type === "camli_van";
// Şasi boyu, tavan ve yükleme yüksekliği: van/panelvan, minibüs ve camlı vanda (minivan'da değil).
const isVanOrMinibus: ShowIf = (a) => kasaBos(a) || a.body_type === "van" || a.body_type === "panelvan" || a.body_type === "minibus" || a.body_type === "camli_van";
const isPureEv: ShowIf = (a) => a.fuel_type === "EV";
// Pickup 4×4 aktarma tipi yalnız 4×4 olmayanı dışarıda bırakır (4×4 boşsa sorulur).
const isPickup4wd: ShowIf = (a) => isPickupBody(a) && a.four_wd !== "false";

// Sürgülü kapı: minivan'da olduğu gibi van/panelvan'da da (tek/çift) anlamlı.
const hasSlidingDoor: ShowIf = hasSeatCount;

// Kategori bazlı teknik özellik form alanları — admin öneri onay formu ve
// ürün düzenleme formu (/admin/urunler) tarafından ortak kullanılır.
export const SPEC_FIELDS: Record<string, FieldDef[]> = {
  otomobil: [
    { key: "body_type",    label: "Kasa",      type: "select", options: OTOMOBIL_BODY_TYPES },
    { key: "segment",      label: "Segment",   type: "select", options: OTOMOBIL_SEGMENTS },
    { key: "drivetrain",   label: "Çekiş",     type: "select", options: DRIVETRAIN_TYPES },
    { key: "transmission", label: "Vites",     type: "select", options: TRANSMISSION_TYPES },
    { key: "engine_cc",    label: "Motor",     type: "number", unit: "cc", showIf: hasCombustionEngine },
    { key: "power_hp",     label: "Güç",       type: "number", unit: "HP" },
    { key: "torque_nm",    label: "Tork",      type: "number", unit: "Nm" },
    { key: "zero_to_100",  label: "0–100",     type: "number", unit: "sn", placeholder: "örn. 8.5" },
    { key: "top_speed_kmh",label: "Azami Hız", type: "number", unit: "km/s" },
    { key: "tank_l",       label: "Yakıt Dep.",type: "number", unit: "L", showIf: hasCombustionEngine },
    { key: "battery_kwh",  label: "Batarya",   type: "number", unit: "kWh", showIf: hasElectricRange },
    { key: "ev_range_km",  label: "Menzil",    type: "number", unit: "km (WLTP)", showIf: hasElectricRange },
    { key: "charge_hours", label: "Tam Şarj", type: "number", unit: "saat", note: "AC ile %0–%100 tam şarj süresi (saat)", showIf: hasElectricRange },
    { key: "fast_charge_min", label: "Hızlı Şarj (10–80%)", type: "number", unit: "dk", note: "DC hızlı şarjla %10’dan %80’e süre (dakika); kaynak farklı aralık (ör. %20–80) veriyorsa null", showIf: hasElectricRange },
    { key: "boot_l",       label: "Bagaj",     type: "number", unit: "L" },
    { key: "weight_kg",    label: "Ağırlık",   type: "number", unit: "kg" },
    { key: "seat_count",   label: "Koltuk Sayısı", type: "number", unit: "kişi" },
  ],
  motosiklet: [
    { key: "moto_type",    label: "Tip",       type: "select", options: MOTO_TYPES },
    { key: "engine_cc",    label: "Motor",      type: "number", unit: "cc" },
    { key: "power_hp",     label: "Güç",        type: "number", unit: "HP" },
    { key: "torque_nm",    label: "Tork",       type: "number", unit: "Nm" },
    { key: "gearbox",      label: "Şanzıman",   type: "number", unit: "vites", placeholder: "örn. 6" },
    { key: "transmission", label: "Vites Tipi", type: "select", options: TRANSMISSION_TYPES },
    { key: "abs",          label: "ABS",        type: "boolean" },
    { key: "tank_l",       label: "Depo",       type: "number", unit: "L" },
    { key: "weight_kg",    label: "Ağırlık",    type: "number", unit: "kg" },
    { key: "seat_height_mm", label: "Sele Yüks.", type: "number", unit: "mm" },
    { key: "ev_range_km",  label: "Menzil (EV)", type: "number", unit: "km", showIf: isElectricMoto },
    { key: "battery_kwh",  label: "Batarya",     type: "number", unit: "kWh", showIf: isElectricMoto },
    { key: "motor_watt",   label: "Motor Gücü (EV)", type: "number", unit: "W", showIf: isElectricMoto },
    { key: "charge_hours", label: "Tam Şarj", type: "number", unit: "saat", note: "AC ile %0–%100 tam şarj süresi (saat)", showIf: isElectricMoto },
    { key: "fast_charge_min", label: "Hızlı Şarj (10–80%)", type: "number", unit: "dk", note: "DC hızlı şarjla %10’dan %80’e süre (dakika); kaynak farklı aralık (ör. %20–80) veriyorsa null", showIf: isElectricMoto },
    { key: "max_speed_kmh", label: "Azami Hız",  type: "number", unit: "km/s" },
    { key: "removable_battery", label: "Çıkarılabilir Batarya", type: "boolean", showIf: isElectricMoto },
  ],
  "e-scooter": [
    { key: "motor_watt",    label: "Motor Gücü",   type: "number", unit: "W", note: "Nominal (sürekli) güç; yalnız tepe güç biliniyorsa onu girin" },
    { key: "motor_peak_watt", label: "Tepe Motor Gücü", type: "number", unit: "W" },
    { key: "range_km",      label: "Menzil",       type: "number", unit: "km" },
    { key: "max_speed_kmh", label: "Maks. Hız",    type: "number", unit: "km/s" },
    { key: "battery_wh",    label: "Batarya",      type: "number", unit: "Wh" },
    { key: "weight_kg",     label: "Ağırlık",      type: "number", unit: "kg" },
    { key: "charge_hours",  label: "Tam Şarj",  type: "number", unit: "saat", note: "%0–%100 tam şarj süresi (saat)" },
    { key: "ip_rating",     label: "Su Ger.",       type: "text", placeholder: "örn. IP54" },
    { key: "max_load_kg",   label: "Maks. Yük",    type: "number", unit: "kg" },
    { key: "tire_inch",     label: "Lastik",       type: "number", unit: "\"" },
    { key: "brake_type",    label: "Fren",         type: "text", placeholder: "örn. Ön elektronik, arka disk" },
    { key: "suspension",    label: "Süspansiyon",  type: "text", placeholder: "örn. Ön ve arka hidrolik" },
    { key: "display",       label: "Ekran",        type: "text", placeholder: "örn. TFT" },
    { key: "max_slope_pct", label: "Maks. Eğim",   type: "number", unit: "%" },
    { key: "removable_battery", label: "Çıkarılabilir Batarya", type: "boolean" },
    { key: "foldable",      label: "Katlanabilir", type: "boolean" },
  ],
  "e-bisiklet": [
    { key: "bike_type",    label: "Bisiklet Tipi", type: "select", options: BIKE_TYPES },
    { key: "motor_type",   label: "Motor Tipi",    type: "select", options: EBIKE_MOTOR_TYPES },
    { key: "motor_model",  label: "Motor Modeli",  type: "text", placeholder: "örn. Brompton e-Motiq" },
    { key: "pedelec_class", label: "Pedelec",      type: "select", options: PEDELEC_CLASSES },
    { key: "motor_watt",   label: "Motor Gücü",    type: "number", unit: "W" },
    { key: "motor_torque_nm", label: "Motor Torku", type: "number", unit: "Nm" },
    { key: "max_speed_kmh",label: "Maks. Hız",     type: "number", unit: "km/s", note: "Motor desteğinin kesildiği hız" },
    { key: "support_levels", label: "Destek Seviyesi", type: "number", unit: "adet", placeholder: "örn. 3" },
    { key: "start_assist", label: "Kalkış Desteği", type: "boolean" },
    { key: "walk_assist",  label: "Yürüme Desteği", type: "boolean" },
    { key: "battery_wh",   label: "Batarya",       type: "number", unit: "Wh" },
    { key: "battery_voltage_v", label: "Batarya Gerilimi", type: "number", unit: "V" },
    { key: "range_km",     label: "Menzil",        type: "number", unit: "km", note: "Üreticinin verdiği azami menzil" },
    { key: "charge_hours", label: "Tam Şarj",   type: "number", unit: "saat", note: "%0–%100 tam şarj süresi (saat)" },
    { key: "removable_battery", label: "Çıkarılabilir Batarya", type: "boolean" },
    { key: "weight_kg",    label: "Ağırlık",       type: "number", unit: "kg", note: "Bataryalı toplam ağırlık; \"den itibaren\" verilmişse en düşük değer" },
    { key: "weight_no_battery_kg", label: "Bataryasız Ağırlık", type: "number", unit: "kg" },
    { key: "max_load_kg",  label: "Maks. Yük",     type: "number", unit: "kg", note: "Sürücü + yük toplamı" },
    { key: "folded_size",  label: "Katlanmış Ölçü", type: "text", placeholder: "örn. 64,5 × 60 × 32 cm", showIf: isFoldingBike },
    { key: "frame_material", label: "Kadro Malzemesi", type: "text", placeholder: "örn. Alüminyum" },
    { key: "fork_material", label: "Çatal",        type: "text", placeholder: "örn. Karbon fiber" },
    { key: "suspension",   label: "Süspansiyon",   type: "text", placeholder: "örn. Ön amortisörlü" },
    { key: "gearbox",      label: "Vites Sayısı",  type: "number", unit: "vites", placeholder: "örn. 7" },
    { key: "gear_type",    label: "Vites Sistemi", type: "text", placeholder: "örn. Shimano Nexus göbek" },
    { key: "wheel_size",   label: "Tekerlek",      type: "text", placeholder: "örn. 16\" / ETRTO 349" },
    { key: "tire_size",    label: "Lastik Ölçüsü", type: "text", placeholder: "örn. 349 × 35C" },
    { key: "brake_type",   label: "Fren",          type: "text", placeholder: "örn. Hidrolik disk" },
    { key: "has_rack",     label: "Bagaj Taşıyıcı", type: "boolean" },
    { key: "has_mudguards", label: "Çamurluk",     type: "boolean" },
    { key: "has_lights",   label: "Entegre Aydınlatma", type: "boolean" },
    { key: "display",      label: "Ekran",         type: "text", placeholder: "örn. LCD gösterge" },
    { key: "has_gps",      label: "GPS / Takip",   type: "boolean" },
    { key: "app_name",     label: "Mobil Uygulama", type: "text", placeholder: "örn. Brompton Electric App" },
  ],
  karavan: [
    { key: "karavan_type", label: "Tip",            type: "select", options: KARAVAN_TYPES },
    { key: "karavan_alt_tip", label: "Alt Tip",     type: "select", options: KARAVAN_ALT_TIPLERI },
    { key: "berth",          label: "Yatak Kap.",   type: "number", unit: "kişi" },
    { key: "bed_layout",     label: "Yatak Düzeni", type: "text", placeholder: "örn. Fransız yatak + ranza" },
    { key: "license_class",  label: "Ehliyet Sınıfı", type: "select", options: KARAVAN_LICENSE_CLASSES },
    { key: "chassis_brand",  label: "Şasi / Taban Araç", type: "text", placeholder: "örn. AL-KO ya da Fiat Ducato" },
    { key: "pop_top",        label: "Yükselen Çatı", type: "boolean", showIf: isKamperVan },
    { key: "length_cm",      label: "Uzunluk (toplam)", type: "number", unit: "cm", note: "Çekmede çeki oku dahil toplam uzunluk" },
    { key: "body_length_cm", label: "Gövde Uzunluğu", type: "number", unit: "cm" },
    { key: "interior_length_cm", label: "İç Uzunluk", type: "number", unit: "cm" },
    { key: "width_cm",       label: "Genişlik",     type: "number", unit: "cm" },
    { key: "interior_width_cm", label: "İç Genişlik", type: "number", unit: "cm" },
    { key: "height_cm",      label: "İç Yükseklik", type: "number", unit: "cm" },
    { key: "exterior_height_cm", label: "Dış Yükseklik", type: "number", unit: "cm" },
    { key: "empty_weight_kg",label: "Boş Ağırlık",  type: "number", unit: "kg" },
    { key: "mro_kg",         label: "Yürür Ağırlık (MRO)", type: "number", unit: "kg", note: "Kullanıma hazır ağırlık; boş ağırlıktan büyük, azami ağırlıktan küçük" },
    { key: "total_weight_kg",label: "Azami Yüklü Ağırlık", type: "number", unit: "kg" },
    { key: "payload_kg",     label: "Yük Kapasitesi", type: "number", unit: "kg" },
    { key: "tow_weight_kg",  label: "Çekme Ağ.",    type: "number", unit: "kg" },
    { key: "axle_count",     label: "Aks Sayısı",   type: "number", unit: "adet", placeholder: "1 veya 2", showIf: isCekmeKaravan },
    { key: "nose_weight_kg", label: "Çeki Oku Yükü", type: "number", unit: "kg", showIf: isCekmeKaravan },
    { key: "brake_system",   label: "Fren Sistemi", type: "select", options: KARAVAN_BRAKE_SYSTEMS, showIf: isCekmeKaravan },
    { key: "has_braked_axle", label: "Frenli Dingil", type: "boolean" },
    { key: "has_stabilizer", label: "Stabilizatör", type: "boolean", showIf: isCekmeKaravan },
    { key: "tire_size",      label: "Lastik Ölçüsü", type: "text", placeholder: "örn. 185 R14 C" },
    { key: "water_tank_l",   label: "Taze Su Tankı", type: "number", unit: "L" },
    { key: "waste_water_tank_l", label: "Gri Su Tankı", type: "number", unit: "L", note: "Duş, lavabo ve mutfak atık suyu" },
    { key: "black_water_tank_l", label: "Atık (Kara) Su Tankı", type: "number", unit: "L", note: "Tuvalet atık suyu" },
    { key: "fridge_l",       label: "Buzdolabı",    type: "number", unit: "L" },
    { key: "stove_burners",  label: "Ocak Göz Sayısı", type: "number", unit: "adet" },
    { key: "heating_type",   label: "Isıtma",       type: "select", options: HEATING_TYPES },
    { key: "heater_model",   label: "Isıtıcı Modeli", type: "text", placeholder: "örn. Truma S 3004" },
    { key: "toilet_type",    label: "Tuvalet",      type: "select", options: KARAVAN_TOILET_TYPES },
    { key: "has_bathroom",   label: "Banyo",        type: "boolean" },
    { key: "has_shower",     label: "Duş",          type: "boolean" },
    { key: "has_kitchen",    label: "Mutfak",       type: "boolean" },
    { key: "has_ac",         label: "Klima",        type: "boolean" },
    { key: "has_awning",     label: "Tente",        type: "boolean" },
    { key: "solar_w",        label: "Güneş Paneli", type: "number", unit: "W" },
    { key: "leisure_battery_ah", label: "Servis Aküsü", type: "number", unit: "Ah" },
    { key: "has_shore_power", label: "220V Şebeke Girişi", type: "boolean" },
    { key: "fuel_type",      label: "Yakıt",        type: "select", options: KARAVAN_FUEL_TYPES, showIf: isMotorizedKaravan },
    { key: "engine_cc",      label: "Motor",        type: "number", unit: "cc", showIf: isMotorizedKaravan },
    { key: "power_hp",       label: "Güç",          type: "number", unit: "HP", showIf: isMotorizedKaravan },
    { key: "transmission",   label: "Vites",        type: "select", showIf: isMotorizedKaravan, options: TRANSMISSION_TYPES },
    { key: "drivetrain",     label: "Çekiş",        type: "select", showIf: isMotorizedKaravan, options: DRIVETRAIN_TYPES },
    { key: "tank_l",         label: "Yakıt Deposu", type: "number", unit: "L", showIf: isMotorizedKaravan },
    { key: "fuel_consumption_l", label: "Ort. Tüketim", type: "number", unit: "L/100 km", showIf: isMotorizedKaravan },
    { key: "seat_belts",     label: "Emniyet Kemerli Koltuk", type: "number", unit: "adet", showIf: isMotorizedKaravan },
  ],
  kamyonet: [
    { key: "body_type",     label: "Kasa",          type: "select", options: KAMYONET_BODY_TYPES },
    { key: "cab_type",      label: "Kabin",         type: "select", options: KAMYONET_CAB_TYPES, showIf: isPickupBody },
    { key: "transmission",  label: "Vites",         type: "select", options: TRANSMISSION_TYPES },
    { key: "gearbox",       label: "Vites Sayısı",  type: "number", unit: "vites", placeholder: "örn. 6" },
    { key: "drivetrain",    label: "Çekiş",         type: "select", options: DRIVETRAIN_TYPES },
    { key: "four_wd",       label: "4×4",           type: "boolean" },
    { key: "four_wd_type",  label: "4×4 Tipi",      type: "select", options: KAMYONET_4WD_TYPES, showIf: isPickup4wd },
    { key: "engine_cc",     label: "Motor",         type: "number", unit: "cc", showIf: hasCombustionEngine },
    { key: "power_hp",      label: "Güç",           type: "number", unit: "HP" },
    { key: "torque_nm",     label: "Tork",          type: "number", unit: "Nm" },
    { key: "zero_to_100",   label: "0–100",         type: "number", unit: "sn", placeholder: "örn. 11.2" },
    { key: "top_speed_kmh", label: "Azami Hız",     type: "number", unit: "km/s" },
    { key: "fuel_consumption_l", label: "Ort. Tüketim", type: "number", unit: "L/100 km", placeholder: "örn. 5.8", showIf: hasCombustionEngine },
    { key: "tank_l",        label: "Yakıt Dep.",    type: "number", unit: "L", showIf: hasCombustionEngine },
    { key: "battery_kwh",   label: "Batarya",       type: "number", unit: "kWh", showIf: hasElectricRange },
    { key: "ev_range_km",   label: "Menzil",        type: "number", unit: "km (WLTP)", showIf: hasElectricRange },
    { key: "ev_consumption_kwh", label: "Elektrik Tüketimi", type: "number", unit: "kWh/100 km", placeholder: "örn. 31", showIf: isPureEv },
    { key: "charge_hours",  label: "Tam Şarj",      type: "number", unit: "saat", note: "AC ile %0–%100 tam şarj süresi (saat)", showIf: hasElectricRange },
    { key: "ac_charge_kw",  label: "AC Maks. Şarj Gücü", type: "number", unit: "kW", placeholder: "örn. 11", showIf: hasElectricRange },
    { key: "dc_charge_kw",  label: "DC Maks. Şarj Gücü", type: "number", unit: "kW", showIf: hasElectricRange },
    { key: "fast_charge_min", label: "Hızlı Şarj (10–80%)", type: "number", unit: "dk", note: "DC hızlı şarjla %10’dan %80’e süre (dakika); kaynak farklı aralık (ör. %20–80) veriyorsa null", showIf: hasElectricRange },
    { key: "length_mm",     label: "Uzunluk",       type: "number", unit: "mm" },
    { key: "width_mm",      label: "Genişlik",      type: "number", unit: "mm", note: "Dış aynalar hariç gövde genişliği" },
    { key: "height_mm",     label: "Yükseklik",     type: "number", unit: "mm" },
    { key: "wheelbase_mm",  label: "Dingil Mesafesi", type: "number", unit: "mm" },
    { key: "chassis_length",label: "Şasi Boyu",     type: "select", options: KAMYONET_CHASSIS_LENGTHS, showIf: isVanOrMinibus },
    { key: "roof_height",   label: "Tavan",         type: "select", options: KAMYONET_ROOF_HEIGHTS, showIf: isVanOrMinibus },
    { key: "curb_weight_kg",label: "Boş Ağırlık",   type: "number", unit: "kg" },
    { key: "gvw_kg",        label: "Brüt Ağırlık",  type: "number", unit: "kg", note: "Azami yüklü (GVW) ağırlık" },
    { key: "payload_kg",    label: "Yük Kap.",      type: "number", unit: "kg" },
    { key: "tow_capacity_kg",label: "Çekme Kap.",   type: "number", unit: "kg" },
    { key: "seat_count",    label: "Koltuk Sayısı", type: "number", unit: "kişi", showIf: hasSeatCount },
    { key: "cargo_m3",      label: "Kargo Hacmi",   type: "number", unit: "m³", placeholder: "örn. 6.5", showIf: isVanBody },
    { key: "cargo_length_mm", label: "Yük Boyu",    type: "number", unit: "mm", showIf: isVanBody },
    { key: "cargo_width_mm", label: "Yük Genişliği", type: "number", unit: "mm", note: "Yük bölmesi iç genişliği", showIf: isVanBody },
    { key: "cargo_height_mm", label: "Yük Yüksekliği", type: "number", unit: "mm", showIf: isVanBody },
    { key: "wheel_arch_width_mm", label: "Tekerlek Arası Genişlik", type: "number", unit: "mm", showIf: isVanBody },
    { key: "euro_pallets",  label: "Euro Palet",    type: "number", unit: "adet", showIf: isVanBody },
    { key: "rear_door",     label: "Arka Kapı",     type: "select", options: KAMYONET_REAR_DOORS, showIf: hasSeatCount },
    { key: "rear_door_width_mm", label: "Arka Kapı Genişliği", type: "number", unit: "mm", note: "Arka kapı yükleme genişliği", showIf: hasSeatCount },
    { key: "rear_door_height_mm", label: "Arka Kapı Yüksekliği", type: "number", unit: "mm", showIf: hasSeatCount },
    { key: "sliding_door_width_mm", label: "Sürgülü Kapı Girişi", type: "number", unit: "mm", note: "Sürgülü kapı giriş genişliği", showIf: hasSlidingDoor },
    { key: "loading_height_mm", label: "Yükleme Yüksekliği", type: "number", unit: "mm", note: "Zeminden yük zeminine yükseklik", showIf: isVanOrMinibus },
    { key: "boot_l",        label: "Bagaj",         type: "number", unit: "L", showIf: isMinivanBody },
    { key: "sliding_door",  label: "Sürgülü Kapı",  type: "boolean", showIf: hasSlidingDoor },
    { key: "sliding_door_count", label: "Sürgülü Kapı Sayısı", type: "number", unit: "adet", placeholder: "1 veya 2", showIf: hasSlidingDoor },
    { key: "bed_length_mm", label: "Kasa Boyu",     type: "number", unit: "mm", showIf: isPickupBody },
    { key: "bed_width_mm",  label: "Kasa Genişliği", type: "number", unit: "mm", showIf: isPickupBody },
    { key: "bed_depth_mm",  label: "Kasa Derinliği", type: "number", unit: "mm", showIf: isPickupBody },
    { key: "ground_clearance_mm", label: "Yerden Yükseklik", type: "number", unit: "mm", showIf: isPickupBody },
    { key: "wading_depth_mm", label: "Su Geçiş Derinliği", type: "number", unit: "mm", showIf: isPickupBody },
    { key: "approach_angle_deg", label: "Yaklaşma Açısı", type: "number", unit: "°", showIf: isPickupBody },
    { key: "departure_angle_deg", label: "Uzaklaşma Açısı", type: "number", unit: "°", showIf: isPickupBody },
    { key: "ramp_angle_deg", label: "Rampa Açısı", type: "number", unit: "°", note: "Kırılma (breakover) açısı", showIf: isPickupBody },
    { key: "diff_lock",     label: "Diferansiyel Kilidi", type: "boolean", showIf: isPickup4wd },
    { key: "tire_size",     label: "Lastik Ölçüsü", type: "text", placeholder: "örn. 205/60 R16" },
  ],
};

// Kategori bazlı "kritik" alanlar — karşılaştırma/filtrelemede kullanılan,
// admin onayında yüksek güvenle dolu olması beklenen alanlar. Bunların hepsi
// "high" güvenle doluysa öneri otomatik onaya hazır sayılır (bkz. vehicleSpecs.ts
// readyForAutoApprove). Diğer alanlar (tork, 0-100, bagaj vb.) eksik/düşük
// güvenli olsa da admin'i bloklamaz.
export const CRITICAL_FIELDS: Record<string, string[]> = {
  otomobil:      ["engine_cc", "power_hp", "transmission", "drivetrain", "body_type"],
  motosiklet:    ["engine_cc", "power_hp", "moto_type"],
  "e-scooter":   ["motor_watt", "max_speed_kmh"],
  "e-bisiklet":  ["motor_watt", "bike_type"],
  karavan:       ["karavan_type", "berth", "total_weight_kg", "length_cm"],
  kamyonet:      ["body_type", "engine_cc", "power_hp"],
};

// Elektrikli araçların motor hacmi (engine_cc) olmaz — bu alanı kritik saymaya
// devam etmek her EV onayında sahte "gözden geçirilmeli" uyarısı üretir.
// EV ise engine_cc yerine menzil (ev_range_km) kritik alan olur.
export function getCriticalFields(categorySlug: string, fuelType?: string | null, bodyType?: string | null): string[] {
  let base = CRITICAL_FIELDS[categorySlug] ?? [];
  // Kamyonet: van/panelvan için kargo hacmi, minivan/minibüs/camlı van için koltuk sayısı da beklenir.
  if (categorySlug === "kamyonet") {
    if (bodyType === "van" || bodyType === "panelvan") base = [...base, "cargo_m3"];
    else if (bodyType === "minivan" || bodyType === "minibus" || bodyType === "camli_van") base = [...base, "seat_count"];
  }
  if (fuelType !== "EV") return base;
  return base.map((f) => (f === "engine_cc" ? "ev_range_km" : f));
}

// Alan sayısı fazla olan kategorilerde (örn. karavan: 20 alan) formu bloklara
// ayırıp admin'i tek bakışta "zorunlu"ya odaklamak için. Tanımı olmayan
// kategoriler eski düz-liste görünümünü aynen korur (SpecForm.tsx).
export interface SpecGroup {
  title: string;
  keys: string[];
  defaultOpen?: boolean;
}
export const SPEC_GROUPS: Record<string, SpecGroup[]> = {
  // Kamyonet ~50 alan — gruplara bölünmezse form çok uzar. SPEC_GROUPS'ta
  // olmayan alan formda HİÇ görünmez; yeni alan eklerken buraya da ekleyin
  // (specFieldsKamyonet.test.ts bunu denetler).
  kamyonet: [
    { title: "Temel", keys: ["body_type", "cab_type", "chassis_length", "roof_height", "transmission", "gearbox", "drivetrain", "four_wd", "four_wd_type", "seat_count", "rear_door", "sliding_door", "sliding_door_count", "sliding_door_width_mm"], defaultOpen: true },
    { title: "Motor & Performans", keys: ["engine_cc", "power_hp", "torque_nm", "zero_to_100", "top_speed_kmh", "fuel_consumption_l", "tank_l"], defaultOpen: true },
    { title: "Elektrikli (EV / Hibrit)", keys: ["battery_kwh", "ev_range_km", "ev_consumption_kwh", "charge_hours", "ac_charge_kw", "dc_charge_kw", "fast_charge_min"] },
    { title: "Boyutlar & Ağırlık", keys: ["length_mm", "width_mm", "height_mm", "wheelbase_mm", "curb_weight_kg", "gvw_kg", "payload_kg", "tow_capacity_kg", "tire_size"] },
    { title: "Yük Bölmesi & Kapılar", keys: ["cargo_m3", "cargo_length_mm", "cargo_width_mm", "cargo_height_mm", "wheel_arch_width_mm", "euro_pallets", "boot_l", "loading_height_mm", "rear_door_width_mm", "rear_door_height_mm"] },
    { title: "Pickup Kasa & Arazi", keys: ["bed_length_mm", "bed_width_mm", "bed_depth_mm", "ground_clearance_mm", "wading_depth_mm", "approach_angle_deg", "departure_angle_deg", "ramp_angle_deg", "diff_lock"] },
  ],
  // E-bisiklet ~34 alan: gruplanmazsa form uzar; SPEC_GROUPS dışındaki alan formda görünmez
  // (specFieldsEbike.test.ts bunu denetler).
  "e-bisiklet": [
    { title: "Temel", keys: ["bike_type", "motor_type", "pedelec_class", "motor_watt", "battery_wh", "range_km", "weight_kg"], defaultOpen: true },
    { title: "Motor & Destek", keys: ["motor_model", "motor_torque_nm", "max_speed_kmh", "support_levels", "start_assist", "walk_assist"] },
    { title: "Batarya & Şarj", keys: ["battery_voltage_v", "charge_hours", "removable_battery"] },
    { title: "Ağırlık & Ölçü", keys: ["weight_no_battery_kg", "max_load_kg", "folded_size"] },
    { title: "Kadro & Yürüyen Aksam", keys: ["frame_material", "fork_material", "suspension", "gearbox", "gear_type", "wheel_size", "tire_size", "brake_type"] },
    { title: "Donanım", keys: ["has_rack", "has_mudguards", "has_lights"] },
    { title: "Elektronik", keys: ["display", "has_gps", "app_name"] },
  ],
  karavan: [
    { title: "Zorunlu", keys: ["karavan_type", "berth", "total_weight_kg", "length_cm"], defaultOpen: true },
    { title: "Tip & Genel", keys: ["karavan_alt_tip", "bed_layout", "license_class", "chassis_brand", "pop_top"] },
    { title: "Ölçü & Ağırlık", keys: ["body_length_cm", "interior_length_cm", "width_cm", "interior_width_cm", "height_cm", "exterior_height_cm", "empty_weight_kg", "mro_kg", "payload_kg", "tow_weight_kg", "tire_size"] },
    { title: "Çekme Karavan (aks, fren)", keys: ["axle_count", "nose_weight_kg", "brake_system", "has_braked_axle", "has_stabilizer"] },
    { title: "Yaşam Alanı", keys: ["water_tank_l", "waste_water_tank_l", "black_water_tank_l", "fridge_l", "stove_burners", "heating_type", "heater_model", "toilet_type", "has_bathroom", "has_shower", "has_kitchen", "has_ac", "has_awning"] },
    { title: "Elektrik", keys: ["solar_w", "leisure_battery_ah", "has_shore_power"] },
    { title: "Motor & Şanzıman (motorlu/kamper-van)", keys: ["fuel_type", "engine_cc", "power_hp", "transmission", "drivetrain", "tank_l", "fuel_consumption_l", "seat_belts"] },
  ],
};

// Scraping tabanlı güven skoru olmayan kategorilerde (karavan gibi) admin'in
// elle girdiği değerler arasındaki mantıksal tutarsızlıkları yakalamak için
// basit çapraz-alan kuralları — engelleyici değil, sadece uyarı.
export interface CrossFieldRule {
  fields: string[];
  check: (attrs: Record<string, string>) => boolean;
  message: string;
}
export const CROSS_FIELD_RULES: Record<string, CrossFieldRule[]> = {
  kamyonet: [
    {
      fields: ["curb_weight_kg", "gvw_kg"],
      check: (a) => !a.curb_weight_kg || !a.gvw_kg || Number(a.gvw_kg) > Number(a.curb_weight_kg),
      message: "Brüt Ağırlık, Boş Ağırlık'tan büyük olmalı.",
    },
    {
      fields: ["four_wd", "drivetrain"],
      check: (a) => a.four_wd !== "true" || !a.drivetrain || a.drivetrain === "AWD" || a.drivetrain === "4WD",
      message: 'Çekiş "FWD/RWD" iken 4×4 "Var" olamaz.',
    },
    {
      fields: ["four_wd", "drivetrain"],
      check: (a) => a.four_wd !== "false" || a.drivetrain !== "AWD" && a.drivetrain !== "4WD",
      message: 'Çekiş "AWD/4WD" iken 4×4 "Yok" olamaz.',
    },
  ],
  karavan: [
    {
      fields: ["empty_weight_kg", "total_weight_kg"],
      check: (a) => !a.empty_weight_kg || !a.total_weight_kg || Number(a.empty_weight_kg) < Number(a.total_weight_kg),
      message: "Boş Ağırlık, Azami Yüklü Ağırlık'tan büyük olamaz.",
    },
    {
      fields: ["height_cm", "exterior_height_cm"],
      check: (a) => !a.height_cm || !a.exterior_height_cm || Number(a.exterior_height_cm) > Number(a.height_cm),
      message: "Dış Yükseklik, İç Yükseklik'ten küçük olamaz.",
    },
    {
      fields: ["has_shower", "has_bathroom"],
      check: (a) => a.has_shower !== "true" || a.has_bathroom === "true",
      message: 'Duş "Var" ise Banyo da "Var" olmalı.',
    },
    {
      fields: ["karavan_type", "engine_cc"],
      check: (a) => a.karavan_type !== "cekme" || !a.engine_cc,
      message: "Çekme Karavan'da motor bilgisi olmaz — Tip'i kontrol edin.",
    },
    {
      fields: ["karavan_type", "karavan_alt_tip"],
      check: (a) => !a.karavan_type || !a.karavan_alt_tip || (KARAVAN_ALT_TIP_GRUBU[a.karavan_type] ?? []).includes(a.karavan_alt_tip),
      message: "Alt Tip, seçili Tip ile uyuşmuyor.",
    },
    {
      fields: ["empty_weight_kg", "mro_kg"],
      check: (a) => !a.empty_weight_kg || !a.mro_kg || Number(a.mro_kg) >= Number(a.empty_weight_kg),
      message: "Yürür Ağırlık (MRO), Boş Ağırlık'tan küçük olamaz.",
    },
    {
      fields: ["mro_kg", "total_weight_kg"],
      check: (a) => !a.mro_kg || !a.total_weight_kg || Number(a.mro_kg) <= Number(a.total_weight_kg),
      message: "Yürür Ağırlık (MRO), Azami Yüklü Ağırlık'tan büyük olamaz.",
    },
    {
      fields: ["length_cm", "body_length_cm"],
      check: (a) => !a.length_cm || !a.body_length_cm || Number(a.body_length_cm) <= Number(a.length_cm),
      message: "Gövde Uzunluğu, toplam Uzunluk'tan büyük olamaz.",
    },
    {
      fields: ["interior_length_cm", "body_length_cm"],
      check: (a) => !a.interior_length_cm || !a.body_length_cm || Number(a.interior_length_cm) <= Number(a.body_length_cm),
      message: "İç Uzunluk, Gövde Uzunluğu'ndan büyük olamaz.",
    },
    {
      fields: ["has_stabilizer", "karavan_type"],
      check: (a) => a.has_stabilizer !== "true" || !a.karavan_type || a.karavan_type === "cekme",
      message: "Stabilizatör yalnız Çekme Karavan'da olur.",
    },
  ],
};

export function getCrossFieldWarnings(categorySlug: string, attrs: Record<string, string>): string[] {
  const rules = CROSS_FIELD_RULES[categorySlug] ?? [];
  return rules.filter((r) => !r.check(attrs)).map((r) => r.message);
}
