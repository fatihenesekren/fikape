// "Teknik Özellikler" sekmesinin tam liste mantığı — önceden sadece
// araclar/[slug]/page.tsx içine gömülüydü, takas ilanı detay sayfasında da
// aynı veri (Product.attributes) gösterilmek istendiğinde kod tekrarına yol
// açacaktı. Saf bir fonksiyona çıkarıldı, her iki sayfa da bunu çağırıyor
// (bkz. kullanıcı talebi: takas ilanına Teknik Özellikler sekmesi).
import { FUEL_LABELS } from "@/lib/fuel";
import {
  MOTO_TYPES, OTOMOBIL_BODY_TYPES, KAMYONET_BODY_TYPES, KAMYONET_CAB_TYPES,
  KAMYONET_CHASSIS_LENGTHS, KAMYONET_ROOF_HEIGHTS, KAMYONET_REAR_DOORS, KAMYONET_4WD_TYPES,
  KARAVAN_TYPES,
  BIKE_TYPES, EBIKE_MOTOR_TYPES, PEDELEC_CLASSES, DRIVETRAIN_TYPES, HEATING_TYPES, toLabelMap,
} from "@/lib/vehicleTypes";

export interface SpecItem {
  label: string;
  value: string;
}

const BODY_LABELS: Record<string, string> = {
  ...toLabelMap(OTOMOBIL_BODY_TYPES),
  ...toLabelMap(KAMYONET_BODY_TYPES),
};
const CAB_TYPE_LABELS = toLabelMap(KAMYONET_CAB_TYPES);
const CHASSIS_LABELS = toLabelMap(KAMYONET_CHASSIS_LENGTHS);
const ROOF_LABELS = toLabelMap(KAMYONET_ROOF_HEIGHTS);
const REAR_DOOR_LABELS = toLabelMap(KAMYONET_REAR_DOORS);
const FOURWD_LABELS = toLabelMap(KAMYONET_4WD_TYPES);
const MOTO_TYPE_LABELS = toLabelMap(MOTO_TYPES);
const KARAVAN_TYPE_LABELS = toLabelMap(KARAVAN_TYPES);
const DRIVETRAIN_LABELS = toLabelMap(DRIVETRAIN_TYPES);
const HEATING_TYPE_LABELS = toLabelMap(HEATING_TYPES);
const BIKE_TYPE_LABELS = toLabelMap(BIKE_TYPES);
const MOTOR_TYPE_LABELS = toLabelMap(EBIKE_MOTOR_TYPES);
const PEDELEC_LABELS = toLabelMap(PEDELEC_CLASSES);

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);

export function buildSpecList(categorySlug: string, attrsInput: unknown): SpecItem[] {
  const attrs = (attrsInput ?? {}) as Record<string, unknown>;
  const fuelType = String(attrs.fuel_type ?? "");
  const bodyType = attrs.body_type ? String(attrs.body_type) : null;
  const motoType = attrs.moto_type ? String(attrs.moto_type) : null;
  const karavanType = attrs.karavan_type ? String(attrs.karavan_type) : null;
  const bikeType = attrs.bike_type ? String(attrs.bike_type) : null;
  const motorType = attrs.motor_type ? String(attrs.motor_type) : null;
  const pedelecClass = attrs.pedelec_class ? String(attrs.pedelec_class) : null;

  const specsRaw: (SpecItem | null)[] = (() => {
    if (categorySlug === "e-bisiklet") return [
      bikeType              ? { label: "Bisiklet Tipi",  value: BIKE_TYPE_LABELS[bikeType] ?? bikeType }            : null,
      motorType             ? { label: "Motor Tipi",     value: MOTOR_TYPE_LABELS[motorType] ?? motorType }          : null,
      pedelecClass          ? { label: "Pedelec Sınıfı", value: PEDELEC_LABELS[pedelecClass] ?? pedelecClass }       : null,
      attrs.motor_watt      ? { label: "Motor Gücü",     value: `${attrs.motor_watt} W` }                           : null,
      attrs.battery_wh      ? { label: "Batarya",        value: `${attrs.battery_wh} Wh` }                          : null,
      attrs.range_km        ? { label: "Menzil",         value: `${attrs.range_km} km` }                            : null,
      attrs.max_speed_kmh   ? { label: "Maks. Hız",      value: `${attrs.max_speed_kmh} km/s` }                     : null,
      attrs.weight_kg       ? { label: "Ağırlık",        value: `${attrs.weight_kg} kg` }                           : null,
      attrs.charge_hours    ? { label: "Tam Şarj",    value: `~${attrs.charge_hours} saat` }                     : null,
      attrs.removable_battery != null ? { label: "Çıkarılabilir Batarya", value: attrs.removable_battery ? "Var" : "Yok" } : null,
      attrs.gearbox         ? { label: "Vites Sayısı",   value: `${attrs.gearbox} vites` }                          : null,
    ];
    if (categorySlug === "e-scooter") return [
      attrs.motor_watt    ? { label: "Motor Gücü",     value: `${attrs.motor_watt} W` }       : null,
      attrs.range_km      ? { label: "Menzil",         value: `${attrs.range_km} km` }         : null,
      attrs.max_speed_kmh ? { label: "Maks. Hız",      value: `${attrs.max_speed_kmh} km/s` } : null,
      attrs.battery_wh    ? { label: "Batarya",        value: `${attrs.battery_wh} Wh` }       : null,
      attrs.weight_kg     ? { label: "Ağırlık",        value: `${attrs.weight_kg} kg` }        : null,
      attrs.charge_hours  ? { label: "Tam Şarj",    value: `~${attrs.charge_hours} saat` }  : null,
      attrs.ip_rating     ? { label: "Su Geçirmezlik", value: String(attrs.ip_rating) }        : null,
      attrs.max_load_kg   ? { label: "Maks. Yük",      value: `${attrs.max_load_kg} kg` }      : null,
      attrs.tire_inch     ? { label: "Lastik",         value: `${attrs.tire_inch}"` }           : null,
      attrs.removable_battery != null ? { label: "Çıkarılabilir Batarya", value: attrs.removable_battery ? "Var" : "Yok" } : null,
      attrs.foldable != null ? { label: "Katlanabilir", value: attrs.foldable ? "Var" : "Yok" } : null,
    ];
    if (categorySlug === "motosiklet") return [
      fuelType              ? { label: "Yakıt",        value: FUEL_LABELS[fuelType] ?? fuelType } : null,
      motoType              ? { label: "Tip",          value: MOTO_TYPE_LABELS[motoType] ?? motoType } : null,
      attrs.engine_cc       ? { label: "Motor",        value: `${attrs.engine_cc} cc` }        : null,
      attrs.power_hp        ? { label: "Güç",          value: `${attrs.power_hp} HP` }         : null,
      attrs.torque_nm       ? { label: "Tork",         value: `${attrs.torque_nm} Nm` }        : null,
      attrs.gearbox         ? { label: "Şanzıman",     value: `${attrs.gearbox} vites` }       : null,
      attrs.transmission    ? { label: "Vites Tipi",   value: capitalize(String(attrs.transmission)) } : null,
      attrs.abs != null     ? { label: "ABS",          value: attrs.abs ? "Var" : "Yok" }      : null,
      attrs.tank_l          ? { label: "Depo",         value: `${attrs.tank_l} L` }            : null,
      attrs.weight_kg       ? { label: "Ağırlık",      value: `${attrs.weight_kg} kg` }        : null,
      attrs.seat_height_mm  ? { label: "Sele Yüks.",   value: `${attrs.seat_height_mm} mm` }   : null,
      // EV'ye özel alanlar — benzinli bir motosiklette bu alanların (özellikle
      // "Çıkarılabilir Batarya") gösterilmesi anlamsız; admin formunda showIf
      // ile zaten girilmesi engellendi (specFields.ts), burada da (eski/hatalı
      // veriye karşı savunma katmanı olarak) fuelType==="EV" şartı eklendi —
      // bkz. kullanıcı geri bildirimi.
      fuelType === "EV" && attrs.ev_range_km     ? { label: "Menzil",       value: `${attrs.ev_range_km} km (WLTP)` } : null,
      fuelType === "EV" && attrs.battery_kwh     ? { label: "Batarya",      value: `${attrs.battery_kwh} kWh` }     : null,
      fuelType === "EV" && attrs.motor_watt      ? { label: "Motor Gücü (EV)", value: `${attrs.motor_watt} W` }      : null,
      fuelType === "EV" && attrs.charge_hours    ? { label: "Tam Şarj",  value: `~${attrs.charge_hours} saat` }  : null,
      fuelType === "EV" && attrs.fast_charge_min ? { label: "Hızlı Şarj (10–80%)", value: `~${attrs.fast_charge_min} dk` } : null,
      attrs.max_speed_kmh   ? { label: "Azami Hız",    value: `${attrs.max_speed_kmh} km/s` }  : null,
      fuelType === "EV" && attrs.removable_battery != null ? { label: "Çıkarılabilir Batarya", value: attrs.removable_battery ? "Var" : "Yok" } : null,
    ];
    if (categorySlug === "karavan") return [
      karavanType                ? { label: "Tip",           value: KARAVAN_TYPE_LABELS[karavanType] ?? karavanType } : null,
      attrs.berth                ? { label: "Yatak Kap.",    value: `${attrs.berth} kişi` }           : null,
      attrs.length_cm            ? { label: "Uzunluk",       value: `${attrs.length_cm} cm` }         : null,
      attrs.width_cm             ? { label: "Genişlik",      value: `${attrs.width_cm} cm` }          : null,
      attrs.height_cm            ? { label: "İç Yükseklik",  value: `${attrs.height_cm} cm` }         : null,
      attrs.exterior_height_cm   ? { label: "Dış Yükseklik", value: `${attrs.exterior_height_cm} cm` } : null,
      attrs.empty_weight_kg      ? { label: "Boş Ağırlık",   value: `${attrs.empty_weight_kg} kg` }   : null,
      attrs.total_weight_kg      ? { label: "Azami Yüklü Ağırlık", value: `${attrs.total_weight_kg} kg` } : null,
      attrs.tow_weight_kg        ? { label: "Çekme Ağ.",     value: `${attrs.tow_weight_kg} kg` }     : null,
      attrs.has_braked_axle != null ? { label: "Frenli Dingil", value: attrs.has_braked_axle ? "Var" : "Yok" } : null,
      attrs.water_tank_l         ? { label: "Taze Su Tankı", value: `${attrs.water_tank_l} L` }       : null,
      attrs.waste_water_tank_l   ? { label: "Gri/Pis Su Tankı", value: `${attrs.waste_water_tank_l} L` } : null,
      attrs.heating_type         ? { label: "Isıtma",        value: HEATING_TYPE_LABELS[String(attrs.heating_type)] ?? capitalize(String(attrs.heating_type)) } : null,
      // "Çekme" karavanın kendi motoru yok — motor/vites alanları sadece
      // motorlu/kamper-van tiplerinde anlamlı (bkz. specFields.ts isMotorizedKaravan,
      // aynı kural CROSS_FIELD_RULES'da da uyarı olarak vardı).
      karavanType !== "cekme" && attrs.engine_cc    ? { label: "Motor",  value: `${attrs.engine_cc} cc` }        : null,
      karavanType !== "cekme" && attrs.power_hp     ? { label: "Güç",    value: `${attrs.power_hp} HP` }         : null,
      karavanType !== "cekme" && attrs.transmission ? { label: "Vites",  value: capitalize(String(attrs.transmission)) } : null,
      attrs.has_bathroom != null ? { label: "Banyo",         value: attrs.has_bathroom ? "Var" : "Yok" } : null,
      attrs.has_shower   != null ? { label: "Duş",           value: attrs.has_shower   ? "Var" : "Yok" } : null,
      attrs.has_kitchen  != null ? { label: "Mutfak",        value: attrs.has_kitchen  ? "Var" : "Yok" } : null,
      attrs.has_ac       != null ? { label: "Klima",         value: attrs.has_ac       ? "Var" : "Yok" } : null,
    ];
    if (categorySlug === "kamyonet") {
      const isEv = fuelType === "EV";
      const hasBattery = isEv || fuelType === "PHEV" || fuelType === "HYBRID";
      const isPickup = bodyType === "pickup";
      const isVan = bodyType === "van" || bodyType === "panelvan";
      const isVanOrMinibus = isVan || bodyType === "minibus";
      const label = (map: Record<string, string>, key: string) => map[String(attrs[key])] ?? String(attrs[key]);
      return [
        fuelType               ? { label: "Yakıt",       value: FUEL_LABELS[fuelType] ?? fuelType } : null,
        bodyType               ? { label: "Kasa",        value: BODY_LABELS[bodyType] ?? bodyType } : null,
        attrs.cab_type         ? { label: "Kabin",       value: CAB_TYPE_LABELS[String(attrs.cab_type)] ?? String(attrs.cab_type) } : null,
        isVanOrMinibus && attrs.chassis_length ? { label: "Şasi Boyu", value: label(CHASSIS_LABELS, "chassis_length") } : null,
        isVanOrMinibus && attrs.roof_height    ? { label: "Tavan",     value: label(ROOF_LABELS, "roof_height") }       : null,
        attrs.transmission     ? { label: "Vites",       value: capitalize(String(attrs.transmission)) }        : null,
        attrs.gearbox          ? { label: "Vites Sayısı", value: `${attrs.gearbox} vites` }      : null,
        attrs.drivetrain       ? { label: "Çekiş",       value: DRIVETRAIN_LABELS[String(attrs.drivetrain)] ?? String(attrs.drivetrain) } : null,
        attrs.four_wd != null  ? { label: "4×4",         value: attrs.four_wd ? "Var" : "Yok" }  : null,
        isPickup && attrs.four_wd && attrs.four_wd_type ? { label: "4×4 Tipi", value: label(FOURWD_LABELS, "four_wd_type") } : null,
        !isEv && attrs.engine_cc ? { label: "Motor",     value: `${attrs.engine_cc} cc` }        : null,
        attrs.power_hp         ? { label: "Güç",         value: `${attrs.power_hp} HP` }         : null,
        attrs.torque_nm        ? { label: "Tork",        value: `${attrs.torque_nm} Nm` }        : null,
        attrs.zero_to_100      ? { label: "0–100 km/s",  value: `${attrs.zero_to_100} sn` }      : null,
        attrs.top_speed_kmh    ? { label: "Azami Hız",   value: `${attrs.top_speed_kmh} km/s` }  : null,
        !isEv && attrs.fuel_consumption_l ? { label: "Ort. Tüketim", value: `${attrs.fuel_consumption_l} L/100 km` } : null,
        !isEv && attrs.tank_l  ? { label: "Yakıt Dep.",  value: `${attrs.tank_l} L` }            : null,
        hasBattery && attrs.ev_range_km    ? { label: "Menzil",   value: `${attrs.ev_range_km} km (WLTP)` } : null,
        hasBattery && attrs.battery_kwh    ? { label: "Batarya",  value: `${attrs.battery_kwh} kWh` }       : null,
        isEv && attrs.ev_consumption_kwh   ? { label: "Elektrik Tüketimi", value: `${attrs.ev_consumption_kwh} kWh/100 km` } : null,
        hasBattery && attrs.charge_hours   ? { label: "Tam Şarj", value: `~${attrs.charge_hours} saat` }    : null,
        hasBattery && attrs.dc_charge_kw   ? { label: "DC Maks. Şarj Gücü", value: `${attrs.dc_charge_kw} kW` } : null,
        hasBattery && attrs.fast_charge_min ? { label: "Hızlı Şarj (10–80%)", value: `~${attrs.fast_charge_min} dk` } : null,
        attrs.length_mm        ? { label: "Uzunluk",     value: `${attrs.length_mm} mm` }        : null,
        attrs.width_mm         ? { label: "Genişlik",    value: `${attrs.width_mm} mm` }         : null,
        attrs.height_mm        ? { label: "Yükseklik",   value: `${attrs.height_mm} mm` }        : null,
        attrs.wheelbase_mm     ? { label: "Dingil Mesafesi", value: `${attrs.wheelbase_mm} mm` } : null,
        attrs.curb_weight_kg   ? { label: "Boş Ağırlık", value: `${attrs.curb_weight_kg} kg` }   : null,
        attrs.gvw_kg           ? { label: "Brüt Ağırlık", value: `${attrs.gvw_kg} kg` }          : null,
        attrs.payload_kg       ? { label: "Yük Kap.",    value: `${attrs.payload_kg} kg` }       : null,
        attrs.tow_capacity_kg  ? { label: "Çekme Kap.",  value: `${attrs.tow_capacity_kg} kg` }  : null,
        attrs.seat_count       ? { label: "Koltuk Sayısı", value: `${attrs.seat_count} kişi` }    : null,
        // Kasa tipi sonradan değişince (ör. van → minibüs) eski kargo hacmi
        // DB'de kalabilir (admin formu boş alanı silemez) — gizli alan gösterilmesin.
        (isVan || !bodyType) && attrs.cargo_m3 ? { label: "Kargo Hacmi", value: `${attrs.cargo_m3} m³` } : null,
        isVan && attrs.cargo_length_mm    ? { label: "Yük Boyu",      value: `${attrs.cargo_length_mm} mm` }    : null,
        isVan && attrs.cargo_width_mm     ? { label: "Yük Genişliği", value: `${attrs.cargo_width_mm} mm` }     : null,
        isVan && attrs.cargo_height_mm    ? { label: "Yük Yüksekliği", value: `${attrs.cargo_height_mm} mm` }   : null,
        isVan && attrs.wheel_arch_width_mm ? { label: "Tekerlek Arası Genişlik", value: `${attrs.wheel_arch_width_mm} mm` } : null,
        isVan && attrs.euro_pallets       ? { label: "Euro Palet",    value: `${attrs.euro_pallets} adet` }     : null,
        attrs.rear_door        ? { label: "Arka Kapı",   value: label(REAR_DOOR_LABELS, "rear_door") } : null,
        attrs.rear_door_width_mm  ? { label: "Arka Kapı Genişliği",  value: `${attrs.rear_door_width_mm} mm` }  : null,
        attrs.rear_door_height_mm ? { label: "Arka Kapı Yüksekliği", value: `${attrs.rear_door_height_mm} mm` } : null,
        isVanOrMinibus && attrs.loading_height_mm ? { label: "Yükleme Yüksekliği", value: `${attrs.loading_height_mm} mm` } : null,
        attrs.sliding_door_width_mm ? { label: "Sürgülü Kapı Girişi", value: `${attrs.sliding_door_width_mm} mm` } : null,
        attrs.boot_l           ? { label: "Bagaj",       value: `${attrs.boot_l} L` }            : null,
        attrs.sliding_door != null ? { label: "Sürgülü Kapı", value: attrs.sliding_door ? (attrs.sliding_door_count ? `${attrs.sliding_door_count} adet` : "Var") : "Yok" } : null,
        isPickup && attrs.bed_length_mm        ? { label: "Kasa Boyu",       value: `${attrs.bed_length_mm} mm` }        : null,
        isPickup && attrs.bed_width_mm         ? { label: "Kasa Genişliği",  value: `${attrs.bed_width_mm} mm` }         : null,
        isPickup && attrs.bed_depth_mm         ? { label: "Kasa Derinliği",  value: `${attrs.bed_depth_mm} mm` }         : null,
        isPickup && attrs.ground_clearance_mm  ? { label: "Yerden Yükseklik", value: `${attrs.ground_clearance_mm} mm` } : null,
        isPickup && attrs.wading_depth_mm      ? { label: "Su Geçiş Derinliği", value: `${attrs.wading_depth_mm} mm` }   : null,
        isPickup && attrs.diff_lock != null    ? { label: "Diferansiyel Kilidi", value: attrs.diff_lock ? "Var" : "Yok" } : null,
        attrs.tire_size        ? { label: "Lastik Ölçüsü", value: String(attrs.tire_size) }       : null,
      ];
    }
    return [
      fuelType             ? { label: "Yakıt",         value: FUEL_LABELS[fuelType] ?? fuelType } : null,
      bodyType             ? { label: "Kasa",          value: BODY_LABELS[bodyType] ?? bodyType } : null,
      attrs.segment        ? { label: "Segment",       value: `${attrs.segment} Segment` }     : null,
      attrs.drivetrain     ? { label: "Çekiş",         value: DRIVETRAIN_LABELS[String(attrs.drivetrain)] ?? String(attrs.drivetrain) } : null,
      attrs.transmission   ? { label: "Vites",         value: capitalize(String(attrs.transmission)) }      : null,
      // Saf EV'de içten yanmalı motor/yakıt deposu, saf benzin/dizel/LPG'de
      // çekiş bataryası/elektrikli menzil yok — PHEV/HYBRID'de ikisi de gerçek
      // (bkz. specFields.ts hasCombustionEngine/hasElectricRange, BYD Seal PHEV
      // örneği: battery_kwh=18.3 doğru veri, sadece saf yakıtlılarda anlamsız).
      fuelType !== "EV"                                     && attrs.engine_cc   ? { label: "Motor",     value: `${attrs.engine_cc} cc` }         : null,
      attrs.power_hp       ? { label: "Güç",           value: `${attrs.power_hp} HP` }          : null,
      attrs.torque_nm      ? { label: "Tork",          value: `${attrs.torque_nm} Nm` }         : null,
      attrs.zero_to_100    ? { label: "0–100 km/s",    value: `${attrs.zero_to_100} sn` }       : null,
      attrs.top_speed_kmh  ? { label: "Azami Hız",     value: `${attrs.top_speed_kmh} km/s` }   : null,
      (fuelType === "EV" || fuelType === "PHEV" || fuelType === "HYBRID") && attrs.ev_range_km  ? { label: "Menzil",  value: `${attrs.ev_range_km} km (WLTP)` } : null,
      (fuelType === "EV" || fuelType === "PHEV" || fuelType === "HYBRID") && attrs.battery_kwh  ? { label: "Batarya", value: `${attrs.battery_kwh} kWh` }      : null,
      (fuelType === "EV" || fuelType === "PHEV" || fuelType === "HYBRID") && attrs.charge_hours ? { label: "Tam Şarj", value: `~${attrs.charge_hours} saat` } : null,
      (fuelType === "EV" || fuelType === "PHEV" || fuelType === "HYBRID") && attrs.fast_charge_min ? { label: "Hızlı Şarj (10–80%)", value: `~${attrs.fast_charge_min} dk` } : null,
      fuelType !== "EV"                                     && attrs.tank_l      ? { label: "Yakıt Dep.", value: `${attrs.tank_l} L` }             : null,
      attrs.boot_l         ? { label: "Bagaj",         value: `${attrs.boot_l} L` }             : null,
      attrs.weight_kg      ? { label: "Ağırlık",       value: `${attrs.weight_kg} kg` }         : null,
      attrs.seat_count     ? { label: "Koltuk Sayısı", value: `${attrs.seat_count} kişi` }      : null,
    ];
  })();

  return specsRaw.filter((s): s is SpecItem => s !== null);
}
