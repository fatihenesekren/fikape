import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const IMG = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${file}`;

async function main() {
  console.log("🌱 Seed başlıyor...");

  // ─────────────────────────────────────────────
  // KATEGORİLER
  // ─────────────────────────────────────────────

  const catAraclar = await prisma.category.upsert({
    where: { slug: "araclar" },
    update: {},
    create: {
      slug: "araclar", name: "Araçlar", sortOrder: 1,
      attributeSchema: {}, reviewFormSchema: [],
    },
  });

  const catOtomobil = await prisma.category.upsert({
    where: { slug: "otomobil" },
    update: {},
    create: {
      slug: "otomobil", name: "Otomobil",
      parentId: catAraclar.id, sortOrder: 1,
      attributeSchema: {
        fuel_type: { type: "enum", values: ["GASOLINE", "DIESEL", "LPG", "HYBRID", "EV"], label: "Yakıt Tipi" },
        segment:   { type: "enum", values: ["A", "B", "C", "D", "E", "F"], label: "Segment" },
        body_type: { type: "enum", values: ["sedan", "hatchback", "suv", "mpv", "coupe", "cabrio"], label: "Kasa Tipi" },
        engine_cc: { type: "number", label: "Motor Hacmi (cc)", nullable: true },
        power_hp:  { type: "number", label: "Güç (HP)", nullable: true },
        ev_range_km: { type: "number", label: "Menzil (km) - Yalnızca EV", nullable: true },
      },
      reviewFormSchema: [
        { key: "real_fuel_per_100km", label: "Gerçek yakıt tüketimi (L/100km)", type: "number", forFuelTypes: ["GASOLINE", "DIESEL", "LPG"] },
        { key: "has_lpg", label: "LPG dönüşümü yaptırdınız mı?", type: "boolean", forFuelTypes: ["GASOLINE"] },
        { key: "real_range_km", label: "Gerçek menzil (km) - Tek şarjda", type: "number", forFuelTypes: ["EV"] },
        { key: "monthly_charge_cost", label: "Aylık şarj maliyeti (₺)", type: "number", forFuelTypes: ["EV"] },
        { key: "score_comfort", label: "Konfor puanı (1-5)", type: "rating", forFuelTypes: ["ALL"] },
        { key: "score_build_quality", label: "Yapı kalitesi puanı (1-5)", type: "rating", forFuelTypes: ["ALL"] },
        { key: "service_experience", label: "Yetkili servis deneyimi", type: "text", forFuelTypes: ["ALL"] },
      ],
    },
  });

  const catMotosiklet = await prisma.category.upsert({
    where: { slug: "motosiklet" },
    update: {},
    create: {
      slug: "motosiklet", name: "Motosiklet",
      parentId: catAraclar.id, sortOrder: 2,
      attributeSchema: {
        engine_cc: { type: "number", label: "Motor Hacmi (cc)" },
        power_hp:  { type: "number", label: "Güç (HP)" },
        moto_type: { type: "enum", values: ["naked", "sport", "touring", "enduro", "adventure", "custom", "elektrikli"], label: "Tip" },
        fuel_type: { type: "enum", values: ["GASOLINE", "EV"], label: "Yakıt Tipi" },
        ev_range_km: { type: "number", label: "Menzil (km) - Yalnızca EV", nullable: true },
      },
      reviewFormSchema: [
        { key: "real_fuel_per_100km", label: "Gerçek yakıt tüketimi (L/100km)", type: "number" },
        { key: "score_handling", label: "Sürüş kabiliyeti (1-5)", type: "rating" },
        { key: "score_comfort", label: "Konfor (1-5)", type: "rating" },
        { key: "score_city_use", label: "Şehir içi kullanım (1-5)", type: "rating" },
        { key: "wind_protection", label: "Rüzgar koruması yeterli mi?", type: "boolean" },
      ],
    },
  });

  const catEscooter = await prisma.category.upsert({
    where: { slug: "e-scooter" },
    update: {},
    create: {
      slug: "e-scooter", name: "E-Scooter / E-Bisiklet",
      parentId: catAraclar.id, sortOrder: 3,
      attributeSchema: {
        scooter_type: { type: "enum", values: ["e-scooter", "e-bisiklet"], label: "Tip" },
        motor_watt:   { type: "number", label: "Motor Gücü (W)" },
        range_km:     { type: "number", label: "İlan Edilen Menzil (km)" },
        max_speed_kmh: { type: "number", label: "Maks. Hız (km/s)" },
        battery_wh:   { type: "number", label: "Batarya Kapasitesi (Wh)" },
      },
      reviewFormSchema: [
        { key: "real_range_km", label: "Gerçek menzil (km)", type: "number" },
        { key: "charge_time_hours", label: "Şarj süresi (saat)", type: "number" },
        { key: "score_build_quality", label: "Yapı kalitesi (1-5)", type: "rating" },
        { key: "score_city_use", label: "Şehir içi kullanım (1-5)", type: "rating" },
        { key: "score_app", label: "Uygulama / yazılım (1-5)", type: "rating" },
        { key: "waterproof_ok", label: "Yağmurda güvenli mi?", type: "boolean" },
      ],
    },
  });

  const catKaravan = await prisma.category.upsert({
    where: { slug: "karavan" },
    update: {},
    create: {
      slug: "karavan", name: "Karavan",
      parentId: catAraclar.id, sortOrder: 4,
      attributeSchema: {
        karavan_type: { type: "enum", values: ["cekme", "motorlu", "kamper-van"], label: "Tip" },
        berth:       { type: "number", label: "Yatak Kapasitesi" },
        length_cm:   { type: "number", label: "Uzunluk (cm)" },
        tow_weight_kg: { type: "number", label: "Ağırlık (kg)", nullable: true },
      },
      reviewFormSchema: [
        { key: "score_insulation", label: "Yalıtım kalitesi (1-5)", type: "rating" },
        { key: "score_storage", label: "Depolama alanı (1-5)", type: "rating" },
        { key: "score_bathroom", label: "Banyo / tuvalet (1-5)", type: "rating" },
        { key: "score_kitchen", label: "Mutfak ekipmanları (1-5)", type: "rating" },
        { key: "winter_use_ok", label: "Kış kullanımına uygun mu?", type: "boolean" },
      ],
    },
  });

  const catKamyonet = await prisma.category.upsert({
    where: { slug: "kamyonet" },
    update: {},
    create: {
      slug: "kamyonet", name: "Kamyonet / Pickup",
      parentId: catAraclar.id, sortOrder: 5,
      attributeSchema: {
        fuel_type:  { type: "enum", values: ["GASOLINE", "DIESEL", "EV"], label: "Yakıt Tipi" },
        body_type:  { type: "enum", values: ["pickup", "van", "minivan"], label: "Kasa Tipi" },
        payload_kg: { type: "number", label: "Yük Kapasitesi (kg)" },
        engine_cc:  { type: "number", label: "Motor Hacmi (cc)" },
        power_hp:   { type: "number", label: "Güç (HP)" },
        four_wd:    { type: "boolean", label: "4x4 / AWD" },
      },
      reviewFormSchema: [
        { key: "real_fuel_per_100km", label: "Gerçek yakıt tüketimi (L/100km)", type: "number" },
        { key: "score_payload", label: "Yük taşıma kapasitesi (1-5)", type: "rating" },
        { key: "score_comfort", label: "Sürüş konforu (1-5)", type: "rating" },
        { key: "score_off_road", label: "Off-road kabiliyeti (1-5)", type: "rating" },
        { key: "score_towing", label: "Çekme kabiliyeti (1-5)", type: "rating" },
      ],
    },
  });

  const catEbisiklet = await prisma.category.upsert({
    where: { slug: "e-bisiklet" },
    update: {},
    create: {
      slug: "e-bisiklet", name: "E-Bisiklet",
      parentId: catAraclar.id, sortOrder: 6,
      attributeSchema: {
        bike_type:     { type: "enum", values: ["sehir", "mtb", "yol", "kargo", "katlanabilir"], label: "Bisiklet Tipi" },
        motor_type:    { type: "enum", values: ["mid-drive", "hub-drive"], label: "Motor Tipi" },
        pedelec_class: { type: "enum", values: ["standard-25", "speed-45"], label: "Pedelec Sınıfı" },
        motor_watt:    { type: "number", label: "Motor Gücü (W)" },
        battery_wh:    { type: "number", label: "Batarya Kapasitesi (Wh)" },
        range_km:      { type: "number", label: "İlan Edilen Menzil (km)" },
        max_speed_kmh: { type: "number", label: "Maks. Hız (km/h)" },
        weight_kg:     { type: "number", label: "Ağırlık (kg)" },
      },
      reviewFormSchema: [
        { key: "real_range_km",       label: "Gerçek menzil (km)",                  type: "number" },
        { key: "motor_type_exp",      label: "Motor tipi",                           type: "enum", options: ["mid-drive", "hub-drive", "diger"] },
        { key: "pedelec_class_exp",   label: "Pedelec sınıfı",                       type: "enum", options: ["standard-25", "speed-45"] },
        { key: "usage_type",          label: "Kullanım tipi",                        type: "enum", options: ["sehir", "mtb", "yol", "kargo"] },
        { key: "score_handling",      label: "Sürüş hissi (1-5)",                   type: "rating" },
        { key: "score_battery",       label: "Batarya performansı (1-5)",            type: "rating" },
        { key: "score_build_quality", label: "Yapı kalitesi (1-5)",                  type: "rating" },
        { key: "score_app",           label: "Uygulama / yazılım (1-5)",             type: "rating" },
        { key: "winter_range_ok",     label: "Kışın menzil düşüşü",                 type: "enum", options: ["minimal", "fark-edilir", "ciddi"] },
        { key: "charge_time_hours",   label: "Şarj süresi (saat)",                  type: "number" },
      ],
    },
  });

  console.log("✓ Kategoriler oluşturuldu (7 kategori)");

  // ─────────────────────────────────────────────
  // MARKALAR
  // ─────────────────────────────────────────────

  const [
    togg, tesla, fiat, renault, dacia,
    honda, yamaha, kawasaki, zeromotorcycles,
    xiaomi, niu, segway,
    knaus, adria, hobby,
    ford, toyota, volkswagen, isuzu, mitsubishi,
  ] = await Promise.all([
    // Mevcut
    prisma.brand.upsert({ where: { slug: "togg" },   update: {}, create: { slug: "togg",   name: "Togg" } }),
    prisma.brand.upsert({ where: { slug: "tesla" },  update: {}, create: { slug: "tesla",  name: "Tesla" } }),
    prisma.brand.upsert({ where: { slug: "fiat" },   update: {}, create: { slug: "fiat",   name: "Fiat" } }),
    prisma.brand.upsert({ where: { slug: "renault" },update: {}, create: { slug: "renault",name: "Renault" } }),
    prisma.brand.upsert({ where: { slug: "dacia" },  update: {}, create: { slug: "dacia",  name: "Dacia" } }),
    // Motosiklet
    prisma.brand.upsert({ where: { slug: "honda" },           update: {}, create: { slug: "honda",           name: "Honda" } }),
    prisma.brand.upsert({ where: { slug: "yamaha" },          update: {}, create: { slug: "yamaha",          name: "Yamaha" } }),
    prisma.brand.upsert({ where: { slug: "kawasaki" },        update: {}, create: { slug: "kawasaki",        name: "Kawasaki" } }),
    prisma.brand.upsert({ where: { slug: "zero-motorcycles" },update: {}, create: { slug: "zero-motorcycles",name: "Zero Motorcycles" } }),
    // E-Scooter
    prisma.brand.upsert({ where: { slug: "xiaomi" }, update: {}, create: { slug: "xiaomi", name: "Xiaomi" } }),
    prisma.brand.upsert({ where: { slug: "niu" },    update: {}, create: { slug: "niu",    name: "NIU" } }),
    prisma.brand.upsert({ where: { slug: "segway" }, update: {}, create: { slug: "segway", name: "Segway" } }),
    // Karavan
    prisma.brand.upsert({ where: { slug: "knaus" }, update: {}, create: { slug: "knaus", name: "Knaus" } }),
    prisma.brand.upsert({ where: { slug: "adria" }, update: {}, create: { slug: "adria", name: "Adria" } }),
    prisma.brand.upsert({ where: { slug: "hobby" }, update: {}, create: { slug: "hobby", name: "Hobby" } }),
    // Kamyonet
    prisma.brand.upsert({ where: { slug: "ford" },       update: {}, create: { slug: "ford",       name: "Ford" } }),
    prisma.brand.upsert({ where: { slug: "toyota" },     update: {}, create: { slug: "toyota",     name: "Toyota" } }),
    prisma.brand.upsert({ where: { slug: "volkswagen" }, update: {}, create: { slug: "volkswagen", name: "Volkswagen" } }),
    prisma.brand.upsert({ where: { slug: "isuzu" },      update: {}, create: { slug: "isuzu",      name: "Isuzu" } }),
    prisma.brand.upsert({ where: { slug: "mitsubishi" }, update: {}, create: { slug: "mitsubishi", name: "Mitsubishi" } }),
  ]);

  console.log("✓ Markalar oluşturuldu (20 marka)");

  // E-Bisiklet markaları
  const [trek, specialized, giant, cube, engwe] = await Promise.all([
    prisma.brand.upsert({ where: { slug: "trek" },        update: {}, create: { slug: "trek",        name: "Trek" } }),
    prisma.brand.upsert({ where: { slug: "specialized" }, update: {}, create: { slug: "specialized", name: "Specialized" } }),
    prisma.brand.upsert({ where: { slug: "giant" },       update: {}, create: { slug: "giant",       name: "Giant" } }),
    prisma.brand.upsert({ where: { slug: "cube" },        update: {}, create: { slug: "cube",        name: "Cube" } }),
    prisma.brand.upsert({ where: { slug: "engwe" },       update: {}, create: { slug: "engwe",       name: "Engwe" } }),
  ]);

  // ─────────────────────────────────────────────
  // MODELLER
  // ─────────────────────────────────────────────

  // Otomobil
  const modelT10X    = await prisma.model.upsert({ where: { slug: "togg-t10x" },     update: {}, create: { slug: "togg-t10x",     name: "T10X",    brandId: togg.id } });
  const modelT10F    = await prisma.model.upsert({ where: { slug: "togg-t10f" },     update: {}, create: { slug: "togg-t10f",     name: "T10F",    brandId: togg.id } });
  const modelModelY  = await prisma.model.upsert({ where: { slug: "tesla-model-y" }, update: {}, create: { slug: "tesla-model-y", name: "Model Y", brandId: tesla.id } });
  const modelEgea    = await prisma.model.upsert({ where: { slug: "fiat-egea" },     update: {}, create: { slug: "fiat-egea",     name: "Egea",    brandId: fiat.id } });
  const modelClio    = await prisma.model.upsert({ where: { slug: "renault-clio" },  update: {}, create: { slug: "renault-clio",  name: "Clio",    brandId: renault.id } });
  const modelDuster  = await prisma.model.upsert({ where: { slug: "dacia-duster" },  update: {}, create: { slug: "dacia-duster",  name: "Duster",  brandId: dacia.id } });

  // Motosiklet
  const modelCB500F     = await prisma.model.upsert({ where: { slug: "honda-cb500f" },      update: {}, create: { slug: "honda-cb500f",      name: "CB500F",       brandId: honda.id } });
  const modelNC750X     = await prisma.model.upsert({ where: { slug: "honda-nc750x" },      update: {}, create: { slug: "honda-nc750x",      name: "NC750X",       brandId: honda.id } });
  const modelMT07       = await prisma.model.upsert({ where: { slug: "yamaha-mt07" },        update: {}, create: { slug: "yamaha-mt07",        name: "MT-07",        brandId: yamaha.id } });
  const modelTracer9    = await prisma.model.upsert({ where: { slug: "yamaha-tracer-9-gt" }, update: {}, create: { slug: "yamaha-tracer-9-gt", name: "Tracer 9 GT",  brandId: yamaha.id } });
  const modelZ650       = await prisma.model.upsert({ where: { slug: "kawasaki-z650" },      update: {}, create: { slug: "kawasaki-z650",      name: "Z650",         brandId: kawasaki.id } });
  const modelNinja400   = await prisma.model.upsert({ where: { slug: "kawasaki-ninja-400" }, update: {}, create: { slug: "kawasaki-ninja-400", name: "Ninja 400",    brandId: kawasaki.id } });
  const modelZeroSRS    = await prisma.model.upsert({ where: { slug: "zero-sr-s" },          update: {}, create: { slug: "zero-sr-s",          name: "SR/S",         brandId: zeromotorcycles.id } });

  // E-Scooter
  const modelXiaomi4Pro = await prisma.model.upsert({ where: { slug: "xiaomi-mi-4-pro" },   update: {}, create: { slug: "xiaomi-mi-4-pro",   name: "Mi Electric Scooter 4 Pro", brandId: xiaomi.id } });
  const modelNiuKqi3    = await prisma.model.upsert({ where: { slug: "niu-kqi3-max" },       update: {}, create: { slug: "niu-kqi3-max",       name: "KQi3 Max",     brandId: niu.id } });
  const modelNinebot    = await prisma.model.upsert({ where: { slug: "segway-ninebot-max" }, update: {}, create: { slug: "segway-ninebot-max", name: "Ninebot Max G30", brandId: segway.id } });

  // Karavan
  const modelKnausSport = await prisma.model.upsert({ where: { slug: "knaus-sport-400" },      update: {}, create: { slug: "knaus-sport-400",      name: "Sport 400 LK",  brandId: knaus.id } });
  const modelAdriaAltea = await prisma.model.upsert({ where: { slug: "adria-altea-432" },      update: {}, create: { slug: "adria-altea-432",      name: "Altea 432 PX",  brandId: adria.id } });
  const modelHobbyPremium = await prisma.model.upsert({ where: { slug: "hobby-premium-650" }, update: {}, create: { slug: "hobby-premium-650", name: "Premium 650 UFe", brandId: hobby.id } });

  // Kamyonet
  const modelRanger     = await prisma.model.upsert({ where: { slug: "ford-ranger" },         update: {}, create: { slug: "ford-ranger",         name: "Ranger",        brandId: ford.id } });
  const modelTransit    = await prisma.model.upsert({ where: { slug: "ford-transit-custom" }, update: {}, create: { slug: "ford-transit-custom", name: "Transit Custom", brandId: ford.id } });
  const modelHilux      = await prisma.model.upsert({ where: { slug: "toyota-hilux" },        update: {}, create: { slug: "toyota-hilux",        name: "Hilux",         brandId: toyota.id } });
  const modelAmarok     = await prisma.model.upsert({ where: { slug: "vw-amarok" },           update: {}, create: { slug: "vw-amarok",           name: "Amarok",        brandId: volkswagen.id } });
  const modelDMax       = await prisma.model.upsert({ where: { slug: "isuzu-d-max" },         update: {}, create: { slug: "isuzu-d-max",         name: "D-Max",         brandId: isuzu.id } });
  const modelL200       = await prisma.model.upsert({ where: { slug: "mitsubishi-l200" },     update: {}, create: { slug: "mitsubishi-l200",     name: "L200",          brandId: mitsubishi.id } });

  // E-Bisiklet modeller
  const modelTrekAllant7      = await prisma.model.upsert({ where: { slug: "trek-allant-7" },           update: {}, create: { slug: "trek-allant-7",           name: "Allant+ 7",          brandId: trek.id } });
  const modelTurboVado        = await prisma.model.upsert({ where: { slug: "specialized-turbo-vado" },  update: {}, create: { slug: "specialized-turbo-vado",  name: "Turbo Vado",         brandId: specialized.id } });
  const modelGiantExplore     = await prisma.model.upsert({ where: { slug: "giant-explore-e-plus-3" },  update: {}, create: { slug: "giant-explore-e-plus-3",  name: "Explore E+ 3 GTS",  brandId: giant.id } });
  const modelCubeKathmandu    = await prisma.model.upsert({ where: { slug: "cube-kathmandu-hybrid" },   update: {}, create: { slug: "cube-kathmandu-hybrid",   name: "Kathmandu Hybrid Pro 500", brandId: cube.id } });
  const modelEngweEnginePro   = await prisma.model.upsert({ where: { slug: "engwe-engine-pro" },        update: {}, create: { slug: "engwe-engine-pro",        name: "Engine Pro",         brandId: engwe.id } });

  console.log("✓ Modeller oluşturuldu (34 model)");

  // ─────────────────────────────────────────────
  // ÜRÜNLER — Otomobil
  // ─────────────────────────────────────────────

  const carProducts = [
    { slug: "togg-t10x-2023", name: "Togg T10X 2023", year: 2023, trimName: "Uzun Menzil",
      imageUrl: IMG("Togg_T10X_Grey.jpg"), modelId: modelT10X.id, brandId: togg.id,
      attributes: { fuel_type: "EV", segment: "C", body_type: "suv", ev_range_km: 523, power_hp: 200,
        battery_kwh: 88.5, torque_nm: 380, drivetrain: "AWD", transmission: "otomatik",
        top_speed_kmh: 210, zero_to_100: 4.8, boot_l: 515, weight_kg: 2082 } },
    { slug: "togg-t10x-2024", name: "Togg T10X 2024", year: 2024, trimName: "Uzun Menzil",
      imageUrl: IMG("Togg_T10X.jpg"), modelId: modelT10X.id, brandId: togg.id,
      attributes: { fuel_type: "EV", segment: "C", body_type: "suv", ev_range_km: 523, power_hp: 200,
        battery_kwh: 88.5, torque_nm: 380, drivetrain: "AWD", transmission: "otomatik",
        top_speed_kmh: 210, zero_to_100: 4.8, boot_l: 515, weight_kg: 2082 } },
    { slug: "togg-t10f-2024", name: "Togg T10F 2024", year: 2024, trimName: "Standart Menzil",
      imageUrl: IMG("Togg_T10F_IAA_2025_DSC_1675.jpg"), modelId: modelT10F.id, brandId: togg.id,
      attributes: { fuel_type: "EV", segment: "C", body_type: "sedan", ev_range_km: 480, power_hp: 200,
        battery_kwh: 52.4, torque_nm: 230, drivetrain: "RWD", transmission: "otomatik",
        top_speed_kmh: 180, zero_to_100: 7.5, boot_l: 450, weight_kg: 1930 } },
    { slug: "tesla-model-y-2023", name: "Tesla Model Y 2023", year: 2023, trimName: "Long Range AWD",
      imageUrl: IMG("Tesla_Model_Y_front_passenger_side_view.jpg"), modelId: modelModelY.id, brandId: tesla.id,
      attributes: { fuel_type: "EV", segment: "D", body_type: "suv", ev_range_km: 533, power_hp: 299,
        battery_kwh: 75, torque_nm: 493, drivetrain: "AWD", transmission: "otomatik",
        top_speed_kmh: 217, zero_to_100: 5.0, boot_l: 854, weight_kg: 2003 } },
    { slug: "tesla-model-y-2024", name: "Tesla Model Y 2024", year: 2024, trimName: "Long Range RWD",
      imageUrl: IMG("Tesla_Model_Y_Dual_Motor_Solid_Black_(3).jpg"), modelId: modelModelY.id, brandId: tesla.id,
      attributes: { fuel_type: "EV", segment: "D", body_type: "suv", ev_range_km: 533, power_hp: 299,
        battery_kwh: 75, torque_nm: 340, drivetrain: "RWD", transmission: "otomatik",
        top_speed_kmh: 201, zero_to_100: 6.9, boot_l: 854, weight_kg: 1979 } },
    { slug: "fiat-egea-sedan-2020", name: "Fiat Egea Sedan 2020", year: 2020, trimName: "Urban",
      imageUrl: IMG("2019_Fiat_Tipo_1.6_Easy.jpg"), modelId: modelEgea.id, brandId: fiat.id,
      attributes: { fuel_type: "GASOLINE", segment: "C", body_type: "sedan", engine_cc: 1368, power_hp: 95,
        torque_nm: 200, drivetrain: "FWD", transmission: "manuel",
        top_speed_kmh: 190, zero_to_100: 12.5, boot_l: 520, weight_kg: 1215, tank_l: 48 } },
    { slug: "fiat-egea-sedan-2022", name: "Fiat Egea Sedan 2022", year: 2022, trimName: "Urban",
      imageUrl: IMG("Fiat_Tipo_1.4_Sedan_(49182414416).jpg"), modelId: modelEgea.id, brandId: fiat.id,
      attributes: { fuel_type: "GASOLINE", segment: "C", body_type: "sedan", engine_cc: 1368, power_hp: 95,
        torque_nm: 200, drivetrain: "FWD", transmission: "manuel",
        top_speed_kmh: 190, zero_to_100: 12.5, boot_l: 520, weight_kg: 1215, tank_l: 48 } },
    { slug: "fiat-egea-sedan-2024", name: "Fiat Egea Sedan 2024", year: 2024, trimName: "Lounge",
      imageUrl: IMG("Fiat_Tipo_Sedan_Facelift_Leonberg_2022_1X7A0412.jpg"), modelId: modelEgea.id, brandId: fiat.id,
      attributes: { fuel_type: "GASOLINE", segment: "C", body_type: "sedan", engine_cc: 1368, power_hp: 95,
        torque_nm: 200, drivetrain: "FWD", transmission: "manuel",
        top_speed_kmh: 190, zero_to_100: 12.5, boot_l: 520, weight_kg: 1215, tank_l: 48 } },
    { slug: "renault-clio-2021", name: "Renault Clio 2021", year: 2021, trimName: "Touch",
      imageUrl: IMG("Renault_Clio_V_1X7A0309.jpg"), modelId: modelClio.id, brandId: renault.id,
      attributes: { fuel_type: "GASOLINE", segment: "B", body_type: "hatchback", engine_cc: 999, power_hp: 90,
        torque_nm: 160, drivetrain: "FWD", transmission: "manuel",
        top_speed_kmh: 183, zero_to_100: 12.8, boot_l: 391, weight_kg: 1095, tank_l: 40 } },
    { slug: "renault-clio-2023", name: "Renault Clio 2023", year: 2023, trimName: "Techno",
      imageUrl: IMG("Renault_Clio_V_1X7A0392.jpg"), modelId: modelClio.id, brandId: renault.id,
      attributes: { fuel_type: "GASOLINE", segment: "B", body_type: "hatchback", engine_cc: 999, power_hp: 90,
        torque_nm: 160, drivetrain: "FWD", transmission: "manuel",
        top_speed_kmh: 183, zero_to_100: 12.8, boot_l: 391, weight_kg: 1095, tank_l: 40 } },
    { slug: "renault-clio-hybrid-2023", name: "Renault Clio Hybrid 2023", year: 2023, trimName: "E-Tech",
      imageUrl: IMG("2023_Renault_Clio_RS_Line_E-Tech_Hybrid.jpg"), modelId: modelClio.id, brandId: renault.id,
      attributes: { fuel_type: "HYBRID", segment: "B", body_type: "hatchback", engine_cc: 1598, power_hp: 145,
        torque_nm: 148, drivetrain: "FWD", transmission: "otomatik",
        top_speed_kmh: 180, zero_to_100: 10.5, boot_l: 391, weight_kg: 1360, tank_l: 40 } },
    { slug: "dacia-duster-2021", name: "Dacia Duster 2021", year: 2021, trimName: "Comfort",
      imageUrl: IMG("Dacia_Duster_II_Facelift_IAA_2021_1X7A0132.jpg"), modelId: modelDuster.id, brandId: dacia.id,
      attributes: { fuel_type: "GASOLINE", segment: "B", body_type: "suv", engine_cc: 999, power_hp: 90,
        torque_nm: 160, drivetrain: "FWD", transmission: "manuel",
        top_speed_kmh: 175, zero_to_100: 13.5, boot_l: 445, weight_kg: 1260, tank_l: 50 } },
    { slug: "dacia-duster-2024", name: "Dacia Duster 2024", year: 2024, trimName: "Extreme",
      imageUrl: IMG("2023_Dacia_Duster_front.png"), modelId: modelDuster.id, brandId: dacia.id,
      attributes: { fuel_type: "GASOLINE", segment: "B", body_type: "suv", engine_cc: 1199, power_hp: 130,
        torque_nm: 230, drivetrain: "FWD", transmission: "manuel",
        top_speed_kmh: 188, zero_to_100: 10.6, boot_l: 472, weight_kg: 1355, tank_l: 50 } },
  ];

  for (const p of carProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { trimName: p.trimName, attributes: p.attributes, ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}) },
      create: { ...p, categoryId: catOtomobil.id },
    });
  }

  // ─────────────────────────────────────────────
  // ÜRÜNLER — Motosiklet
  // ─────────────────────────────────────────────

  const motoProducts = [
    { slug: "honda-cb500f-2023", name: "Honda CB500F 2023", year: 2023, trimName: null,
      imageUrl: IMG("2021_Honda_CB500F.jpg"), modelId: modelCB500F.id, brandId: honda.id,
      attributes: { fuel_type: "GASOLINE", moto_type: "naked", engine_cc: 471, power_hp: 47,
        torque_nm: 43, gearbox: 6, abs: true, weight_kg: 192, seat_height_mm: 790, tank_l: 17.7 } },
    { slug: "honda-nc750x-2023", name: "Honda NC750X 2023", year: 2023, trimName: "DCT",
      imageUrl: IMG("2021_Honda_NC750X_(DCT).jpg"), modelId: modelNC750X.id, brandId: honda.id,
      attributes: { fuel_type: "GASOLINE", moto_type: "adventure", engine_cc: 745, power_hp: 58,
        torque_nm: 69, gearbox: 6, abs: true, weight_kg: 218, seat_height_mm: 800, tank_l: 14.1 } },
    { slug: "yamaha-mt07-2023", name: "Yamaha MT-07 2023", year: 2023, trimName: null,
      imageUrl: IMG("2021_Black_Yamaha_MT-07.jpg"), modelId: modelMT07.id, brandId: yamaha.id,
      attributes: { fuel_type: "GASOLINE", moto_type: "naked", engine_cc: 689, power_hp: 73,
        torque_nm: 74, gearbox: 6, abs: true, weight_kg: 193, seat_height_mm: 805, tank_l: 13 } },
    { slug: "yamaha-tracer-9-gt-2023", name: "Yamaha Tracer 9 GT 2023", year: 2023, trimName: "GT+",
      imageUrl: IMG("2022_Yamaha_Tracer9_GT.jpg"), modelId: modelTracer9.id, brandId: yamaha.id,
      attributes: { fuel_type: "GASOLINE", moto_type: "touring", engine_cc: 889, power_hp: 119,
        torque_nm: 87, gearbox: 6, abs: true, weight_kg: 228, seat_height_mm: 820, tank_l: 20 } },
    { slug: "kawasaki-z650-2023", name: "Kawasaki Z650 2023", year: 2023, trimName: null,
      imageUrl: IMG("Kawasaki_Z_650_MY_2017.jpg"), modelId: modelZ650.id, brandId: kawasaki.id,
      attributes: { fuel_type: "GASOLINE", moto_type: "naked", engine_cc: 649, power_hp: 68,
        torque_nm: 66, gearbox: 6, abs: true, weight_kg: 187, seat_height_mm: 790, tank_l: 15 } },
    { slug: "kawasaki-ninja-400-2023", name: "Kawasaki Ninja 400 2023", year: 2023, trimName: null,
      imageUrl: IMG("Kawasaki_Ninja_400_KRT_Edition_(facelift_model)_right_side.jpg"),
      modelId: modelNinja400.id, brandId: kawasaki.id,
      attributes: { fuel_type: "GASOLINE", moto_type: "sport", engine_cc: 399, power_hp: 45,
        torque_nm: 38, gearbox: 6, abs: true, weight_kg: 168, seat_height_mm: 785, tank_l: 14 } },
    { slug: "zero-sr-s-2024", name: "Zero SR/S 2024", year: 2024, trimName: "Premium",
      imageUrl: null, modelId: modelZeroSRS.id, brandId: zeromotorcycles.id,
      attributes: { fuel_type: "EV", moto_type: "elektrikli", ev_range_km: 259, power_hp: 110,
        torque_nm: 190, abs: true, weight_kg: 220, seat_height_mm: 787 } },
  ];

  for (const p of motoProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { attributes: p.attributes, ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}) },
      create: { ...p, categoryId: catMotosiklet.id },
    });
  }

  // ─────────────────────────────────────────────
  // ÜRÜNLER — E-Scooter / E-Bisiklet
  // ─────────────────────────────────────────────

  const escooterProducts = [
    { slug: "xiaomi-mi-4-pro-2023", name: "Xiaomi Mi Electric Scooter 4 Pro 2023", year: 2023, trimName: null,
      imageUrl: null, modelId: modelXiaomi4Pro.id, brandId: xiaomi.id,
      attributes: { scooter_type: "e-scooter", motor_watt: 700, range_km: 55, max_speed_kmh: 25,
        battery_wh: 446, weight_kg: 14.9, charge_hours: 9, ip_rating: "IP54", max_load_kg: 100, tire_inch: 10 } },
    { slug: "niu-kqi3-max-2023", name: "NIU KQi3 Max 2023", year: 2023, trimName: null,
      imageUrl: null, modelId: modelNiuKqi3.id, brandId: niu.id,
      attributes: { scooter_type: "e-scooter", motor_watt: 700, range_km: 80, max_speed_kmh: 35,
        battery_wh: 608, weight_kg: 25.0, charge_hours: 7, ip_rating: "IPX5", max_load_kg: 100, tire_inch: 10 } },
    { slug: "segway-ninebot-max-g30-2022", name: "Segway Ninebot Max G30 2022", year: 2022, trimName: "G30P",
      imageUrl: null, modelId: modelNinebot.id, brandId: segway.id,
      attributes: { scooter_type: "e-scooter", motor_watt: 350, range_km: 65, max_speed_kmh: 25,
        battery_wh: 551, weight_kg: 18.7, charge_hours: 6, ip_rating: "IPX5", max_load_kg: 100, tire_inch: 10 } },
  ];

  for (const p of escooterProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { attributes: p.attributes, ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}) },
      create: { ...p, categoryId: catEscooter.id },
    });
  }

  // ─────────────────────────────────────────────
  // ÜRÜNLER — Karavan
  // ─────────────────────────────────────────────

  const karavanProducts = [
    { slug: "knaus-sport-400-lk-2023", name: "Knaus Sport 400 LK 2023", year: 2023, trimName: null,
      imageUrl: IMG("Knaus_Ski_I_PMS14.jpg"), modelId: modelKnausSport.id, brandId: knaus.id,
      attributes: { karavan_type: "cekme", berth: 4, length_cm: 735, tow_weight_kg: 1290,
        width_cm: 226, total_weight_kg: 1500, has_bathroom: true, has_kitchen: true, has_ac: false } },
    { slug: "adria-altea-432-px-2023", name: "Adria Altea 432 PX 2023", year: 2023, trimName: null,
      imageUrl: IMG("Adria_Altea_390_PS_r.jpg"), modelId: modelAdriaAltea.id, brandId: adria.id,
      attributes: { karavan_type: "cekme", berth: 4, length_cm: 780, tow_weight_kg: 1350,
        width_cm: 230, total_weight_kg: 1500, has_bathroom: true, has_kitchen: true, has_ac: false } },
    { slug: "hobby-premium-650-ufe-2023", name: "Hobby Premium 650 UFe 2023", year: 2023, trimName: null,
      imageUrl: IMG("Hobby_Premium_650_UFe_(2)_ACC_Berlin_2017.JPG"), modelId: modelHobbyPremium.id, brandId: hobby.id,
      attributes: { karavan_type: "cekme", berth: 4, length_cm: 820, tow_weight_kg: 1600,
        width_cm: 250, total_weight_kg: 1800, has_bathroom: true, has_kitchen: true, has_ac: true } },
  ];

  for (const p of karavanProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { attributes: p.attributes, ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}) },
      create: { ...p, categoryId: catKaravan.id },
    });
  }

  // ─────────────────────────────────────────────
  // ÜRÜNLER — Kamyonet / Pickup
  // ─────────────────────────────────────────────

  const kamyonetProducts = [
    { slug: "ford-ranger-2023", name: "Ford Ranger 2023", year: 2023, trimName: "Wildtrak",
      imageUrl: IMG("2023_Ford_Ranger_Wildtrak_EcoBlue_4x4_Auto.jpg"), modelId: modelRanger.id, brandId: ford.id,
      attributes: { fuel_type: "DIESEL", body_type: "pickup", payload_kg: 1030, engine_cc: 2000, power_hp: 170,
        torque_nm: 500, four_wd: true, tow_capacity_kg: 3500, tank_l: 80 } },
    { slug: "ford-ranger-2024", name: "Ford Ranger 2024", year: 2024, trimName: "Raptor",
      imageUrl: IMG("2023_Ford_Ranger_Raptor_Ecoboost_Auto.jpg"), modelId: modelRanger.id, brandId: ford.id,
      attributes: { fuel_type: "GASOLINE", body_type: "pickup", payload_kg: 925, engine_cc: 3000, power_hp: 292,
        torque_nm: 583, four_wd: true, tow_capacity_kg: 2500, tank_l: 80 } },
    { slug: "ford-transit-custom-2023", name: "Ford Transit Custom 2023", year: 2023, trimName: "Trend",
      imageUrl: IMG("Ford_Transit_Custom_(2023)_1X7A1645.jpg"), modelId: modelTransit.id, brandId: ford.id,
      attributes: { fuel_type: "DIESEL", body_type: "van", payload_kg: 1186, engine_cc: 2000, power_hp: 136,
        torque_nm: 360, four_wd: false, tow_capacity_kg: 2000, tank_l: 70 } },
    { slug: "toyota-hilux-2023", name: "Toyota Hilux 2023", year: 2023, trimName: "Adventure",
      imageUrl: IMG("Toyota_HiLux_GR_Sport_1X7A7281.jpg"), modelId: modelHilux.id, brandId: toyota.id,
      attributes: { fuel_type: "DIESEL", body_type: "pickup", payload_kg: 1080, engine_cc: 2755, power_hp: 204,
        torque_nm: 500, four_wd: true, tow_capacity_kg: 3500, tank_l: 80 } },
    { slug: "vw-amarok-2023", name: "Volkswagen Amarok 2023", year: 2023, trimName: "PanAmericana",
      imageUrl: IMG("Volkswagen_Amarok_Mk2_Caflisch_Auto_Zuerich_2023_1X7A1440.jpg"), modelId: modelAmarok.id, brandId: volkswagen.id,
      attributes: { fuel_type: "DIESEL", body_type: "pickup", payload_kg: 1160, engine_cc: 3000, power_hp: 240,
        torque_nm: 600, four_wd: true, tow_capacity_kg: 3500, tank_l: 70 } },
    { slug: "isuzu-d-max-2023", name: "Isuzu D-Max 2023", year: 2023, trimName: "V-Cross",
      imageUrl: IMG("2023_Isuzu_D-Max_V-Cross_4-Door_3.0_Ddi_M.jpg"), modelId: modelDMax.id, brandId: isuzu.id,
      attributes: { fuel_type: "DIESEL", body_type: "pickup", payload_kg: 1105, engine_cc: 1898, power_hp: 164,
        torque_nm: 450, four_wd: true, tow_capacity_kg: 3500, tank_l: 76 } },
    { slug: "mitsubishi-l200-2023", name: "Mitsubishi L200 2023", year: 2023, trimName: "Athlete",
      imageUrl: IMG("Mitsubishi_L200,_GIMS_2019,_Le_Grand-Saconnex_(GIMS0722).jpg"), modelId: modelL200.id, brandId: mitsubishi.id,
      attributes: { fuel_type: "DIESEL", body_type: "pickup", payload_kg: 1100, engine_cc: 2268, power_hp: 150,
        torque_nm: 400, four_wd: true, tow_capacity_kg: 3100, tank_l: 75 } },
  ];

  for (const p of kamyonetProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { trimName: p.trimName, attributes: p.attributes, ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}) },
      create: { ...p, categoryId: catKamyonet.id },
    });
  }

  // ─────────────────────────────────────────────
  // ÜRÜNLER — E-Bisiklet
  // ─────────────────────────────────────────────

  const ebisikletProducts = [
    { slug: "trek-allant-7-2023", name: "Trek Allant+ 7 2023", year: 2023, trimName: null,
      imageUrl: "https://electricbikereview.com/wp-content/assets/2020/03/trek-allant-plus-7.jpg",
      modelId: modelTrekAllant7.id, brandId: trek.id,
      attributes: { bike_type: "sehir", motor_type: "hub-drive", pedelec_class: "standard-25",
        motor_watt: 250, battery_wh: 625, range_km: 120, max_speed_kmh: 25, weight_kg: 22.8 } },
    { slug: "specialized-turbo-vado-5-2023", name: "Specialized Turbo Vado 5.0 IGH EQ 2023", year: 2023, trimName: "5.0 IGH EQ",
      imageUrl: "https://cyclelimited.com/cdn/shop/files/JCO_3976_2560x2560.jpg?v=1730393478",
      modelId: modelTurboVado.id, brandId: specialized.id,
      attributes: { bike_type: "sehir", motor_type: "mid-drive", pedelec_class: "standard-25",
        motor_watt: 250, battery_wh: 320, range_km: 100, max_speed_kmh: 25, weight_kg: 18.2 } },
    { slug: "giant-explore-e-plus-3-2023", name: "Giant Explore E+ 3 GTS 2023", year: 2023, trimName: "3 GTS",
      imageUrl: "https://images2.giant-bicycles.com/b_white%2Cc_pad%2Ch_800%2Cq_90%2Cw_800/yc14hxxfmdui7mehomll/MY23ExploreEplus3DD_ColorASpaceGrey.jpg",
      modelId: modelGiantExplore.id, brandId: giant.id,
      attributes: { bike_type: "sehir", motor_type: "mid-drive", pedelec_class: "standard-25",
        motor_watt: 250, battery_wh: 500, range_km: 100, max_speed_kmh: 25, weight_kg: 24.5 } },
    { slug: "cube-kathmandu-hybrid-pro-2023", name: "Cube Kathmandu Hybrid Pro 500 2023", year: 2023, trimName: "Pro 500",
      imageUrl: "https://file.cube.eu/azwesc1xfg346/media/57/4a/67/1754323511/synqup_112202_360I_00.jpg",
      modelId: modelCubeKathmandu.id, brandId: cube.id,
      attributes: { bike_type: "sehir", motor_type: "mid-drive", pedelec_class: "standard-25",
        motor_watt: 250, battery_wh: 500, range_km: 110, max_speed_kmh: 25, weight_kg: 25.0 } },
    { slug: "engwe-engine-pro-2023", name: "Engwe Engine Pro 2023", year: 2023, trimName: null,
      imageUrl: "https://us.engwe.com/cdn/shop/files/6_8245e44e-74ec-4927-9c2d-14c92a424f52.jpg?v=1715078347&width=1214",
      modelId: modelEngweEnginePro.id, brandId: engwe.id,
      attributes: { bike_type: "mtb", motor_type: "hub-drive", pedelec_class: "speed-45",
        motor_watt: 750, battery_wh: 768, range_km: 120, max_speed_kmh: 45, weight_kg: 35.0 } },
  ];

  for (const p of ebisikletProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { attributes: p.attributes, ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}) },
      create: { ...p, categoryId: catEbisiklet.id },
    });
  }

  console.log("✓ Ürünler oluşturuldu");

  // ─────────────────────────────────────────────
  // TREND — Demo viewCount değerleri
  // ─────────────────────────────────────────────

  const trendData = [
    { slug: "togg-t10x-2024",           viewCount: 2840, weeklyViewCount: 312 },
    { slug: "ford-ranger-2024",          viewCount: 2210, weeklyViewCount: 247 },
    { slug: "yamaha-mt07-2023",          viewCount: 1870, weeklyViewCount: 198 },
    { slug: "tesla-model-y-2024",        viewCount: 1650, weeklyViewCount: 183 },
    { slug: "xiaomi-mi-4-pro-2023",      viewCount: 1420, weeklyViewCount: 154 },
    { slug: "toyota-hilux-2023",         viewCount: 1380, weeklyViewCount: 141 },
    { slug: "kawasaki-ninja-400-2023",   viewCount: 1200, weeklyViewCount: 128 },
    { slug: "dacia-duster-2024",         viewCount: 1090, weeklyViewCount: 117 },
    { slug: "knaus-sport-400-lk-2023",   viewCount:  880, weeklyViewCount:  89 },
    { slug: "zero-sr-s-2024",            viewCount:  760, weeklyViewCount:  74 },
  ];

  for (const { slug, viewCount, weeklyViewCount } of trendData) {
    await prisma.product.update({ where: { slug }, data: { viewCount, weeklyViewCount } });
  }

  console.log("✓ Trend viewCount'lar set edildi");
  console.log("\n🎉 Seed tamamlandı!");
  console.log("   Kategoriler : 7");
  console.log("   Markalar    : 25");
  console.log("   Modeller    : 34");
  console.log("   Ürünler     : 13 araba + 7 motosiklet + 3 e-scooter + 3 karavan + 7 kamyonet + 5 e-bisiklet = 38");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
