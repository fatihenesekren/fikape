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
        segment:   { type: "enum", values: ["A", "B", "C", "D", "E", "SUV"], label: "Segment" },
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

  console.log("✓ Kategoriler oluşturuldu (6 kategori)");

  // ─────────────────────────────────────────────
  // MARKALAR
  // ─────────────────────────────────────────────

  const [
    togg, tesla, fiat, renault, dacia,
    honda, yamaha, kawasaki, zeromotorcycles,
    xiaomi, niu, segway,
    knaus, adria, kiralkaravan,
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
    prisma.brand.upsert({ where: { slug: "knaus" },        update: {}, create: { slug: "knaus",        name: "Knaus" } }),
    prisma.brand.upsert({ where: { slug: "adria" },        update: {}, create: { slug: "adria",        name: "Adria" } }),
    prisma.brand.upsert({ where: { slug: "kiral-karavan" },update: {}, create: { slug: "kiral-karavan",name: "Kıral Karavan" } }),
    // Kamyonet
    prisma.brand.upsert({ where: { slug: "ford" },       update: {}, create: { slug: "ford",       name: "Ford" } }),
    prisma.brand.upsert({ where: { slug: "toyota" },     update: {}, create: { slug: "toyota",     name: "Toyota" } }),
    prisma.brand.upsert({ where: { slug: "volkswagen" }, update: {}, create: { slug: "volkswagen", name: "Volkswagen" } }),
    prisma.brand.upsert({ where: { slug: "isuzu" },      update: {}, create: { slug: "isuzu",      name: "Isuzu" } }),
    prisma.brand.upsert({ where: { slug: "mitsubishi" }, update: {}, create: { slug: "mitsubishi", name: "Mitsubishi" } }),
  ]);

  console.log("✓ Markalar oluşturuldu (20 marka)");

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
  const modelKiralK350  = await prisma.model.upsert({ where: { slug: "kiral-karavan-k350" },   update: {}, create: { slug: "kiral-karavan-k350",   name: "K350",          brandId: kiralkaravan.id } });

  // Kamyonet
  const modelRanger     = await prisma.model.upsert({ where: { slug: "ford-ranger" },         update: {}, create: { slug: "ford-ranger",         name: "Ranger",        brandId: ford.id } });
  const modelTransit    = await prisma.model.upsert({ where: { slug: "ford-transit-custom" }, update: {}, create: { slug: "ford-transit-custom", name: "Transit Custom", brandId: ford.id } });
  const modelHilux      = await prisma.model.upsert({ where: { slug: "toyota-hilux" },        update: {}, create: { slug: "toyota-hilux",        name: "Hilux",         brandId: toyota.id } });
  const modelAmarok     = await prisma.model.upsert({ where: { slug: "vw-amarok" },           update: {}, create: { slug: "vw-amarok",           name: "Amarok",        brandId: volkswagen.id } });
  const modelDMax       = await prisma.model.upsert({ where: { slug: "isuzu-d-max" },         update: {}, create: { slug: "isuzu-d-max",         name: "D-Max",         brandId: isuzu.id } });
  const modelL200       = await prisma.model.upsert({ where: { slug: "mitsubishi-l200" },     update: {}, create: { slug: "mitsubishi-l200",     name: "L200",          brandId: mitsubishi.id } });

  console.log("✓ Modeller oluşturuldu (29 model)");

  // ─────────────────────────────────────────────
  // ÜRÜNLER — Otomobil
  // ─────────────────────────────────────────────

  const carProducts = [
    { slug: "togg-t10x-2023", name: "Togg T10X 2023", year: 2023, trimName: "Uzun Menzil",
      imageUrl: IMG("Togg_T10X_Grey.jpg"),
      modelId: modelT10X.id, brandId: togg.id,
      attributes: { fuel_type: "EV", segment: "C", body_type: "suv", ev_range_km: 523, power_hp: 200 } },
    { slug: "togg-t10x-2024", name: "Togg T10X 2024", year: 2024, trimName: "Uzun Menzil",
      imageUrl: IMG("Togg_T10X.jpg"),
      modelId: modelT10X.id, brandId: togg.id,
      attributes: { fuel_type: "EV", segment: "C", body_type: "suv", ev_range_km: 523, power_hp: 200 } },
    { slug: "togg-t10f-2024", name: "Togg T10F 2024", year: 2024, trimName: "Standart Menzil",
      imageUrl: IMG("Togg_T10F_IAA_2025_DSC_1675.jpg"),
      modelId: modelT10F.id, brandId: togg.id,
      attributes: { fuel_type: "EV", segment: "C", body_type: "sedan", ev_range_km: 480, power_hp: 200 } },
    { slug: "tesla-model-y-2023", name: "Tesla Model Y 2023", year: 2023, trimName: "Long Range AWD",
      imageUrl: IMG("Tesla_Model_Y_front_passenger_side_view.jpg"),
      modelId: modelModelY.id, brandId: tesla.id,
      attributes: { fuel_type: "EV", segment: "D", body_type: "suv", ev_range_km: 533, power_hp: 299 } },
    { slug: "tesla-model-y-2024", name: "Tesla Model Y 2024", year: 2024, trimName: "Long Range RWD",
      imageUrl: IMG("Tesla_Model_Y_Dual_Motor_Solid_Black_(3).jpg"),
      modelId: modelModelY.id, brandId: tesla.id,
      attributes: { fuel_type: "EV", segment: "D", body_type: "suv", ev_range_km: 533, power_hp: 299 } },
    { slug: "fiat-egea-sedan-2020", name: "Fiat Egea Sedan 2020", year: 2020, trimName: "Urban",
      imageUrl: IMG("2019_Fiat_Tipo_1.6_Easy.jpg"),
      modelId: modelEgea.id, brandId: fiat.id,
      attributes: { fuel_type: "GASOLINE", segment: "C", body_type: "sedan", engine_cc: 1368, power_hp: 95 } },
    { slug: "fiat-egea-sedan-2022", name: "Fiat Egea Sedan 2022", year: 2022, trimName: "Urban",
      imageUrl: IMG("Fiat_Tipo_1.4_Sedan_(49182414416).jpg"),
      modelId: modelEgea.id, brandId: fiat.id,
      attributes: { fuel_type: "GASOLINE", segment: "C", body_type: "sedan", engine_cc: 1368, power_hp: 95 } },
    { slug: "fiat-egea-sedan-2024", name: "Fiat Egea Sedan 2024", year: 2024, trimName: "Lounge",
      imageUrl: IMG("Fiat_Tipo_1.4_Sedan_(49182414416).jpg"),
      modelId: modelEgea.id, brandId: fiat.id,
      attributes: { fuel_type: "GASOLINE", segment: "C", body_type: "sedan", engine_cc: 1368, power_hp: 95 } },
    { slug: "renault-clio-2021", name: "Renault Clio 2021", year: 2021, trimName: "Touch",
      imageUrl: IMG("Renault_Clio_V_1X7A0309.jpg"),
      modelId: modelClio.id, brandId: renault.id,
      attributes: { fuel_type: "GASOLINE", segment: "B", body_type: "hatchback", engine_cc: 999, power_hp: 90 } },
    { slug: "renault-clio-2023", name: "Renault Clio 2023", year: 2023, trimName: "Techno",
      imageUrl: IMG("Renault_Clio_V_1X7A0392.jpg"),
      modelId: modelClio.id, brandId: renault.id,
      attributes: { fuel_type: "GASOLINE", segment: "B", body_type: "hatchback", engine_cc: 999, power_hp: 90 } },
    { slug: "renault-clio-hybrid-2023", name: "Renault Clio Hybrid 2023", year: 2023, trimName: "E-Tech",
      imageUrl: IMG("Renault_Clio_V_1X7A0392.jpg"),
      modelId: modelClio.id, brandId: renault.id,
      attributes: { fuel_type: "HYBRID", segment: "B", body_type: "hatchback", engine_cc: 1598, power_hp: 145 } },
    { slug: "dacia-duster-2021", name: "Dacia Duster 2021", year: 2021, trimName: "Comfort",
      imageUrl: IMG("Dacia_Duster_II_Facelift_IAA_2021_1X7A0132.jpg"),
      modelId: modelDuster.id, brandId: dacia.id,
      attributes: { fuel_type: "GASOLINE", segment: "SUV", body_type: "suv", engine_cc: 999, power_hp: 90 } },
    { slug: "dacia-duster-2024", name: "Dacia Duster 2024", year: 2024, trimName: "Extreme",
      imageUrl: IMG("2023_Dacia_Duster_front.png"),
      modelId: modelDuster.id, brandId: dacia.id,
      attributes: { fuel_type: "GASOLINE", segment: "SUV", body_type: "suv", engine_cc: 999, power_hp: 90 } },
  ];

  for (const p of carProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { trimName: p.trimName, imageUrl: p.imageUrl },
      create: { ...p, categoryId: catOtomobil.id },
    });
  }

  // ─────────────────────────────────────────────
  // ÜRÜNLER — Motosiklet
  // ─────────────────────────────────────────────

  const motoProducts = [
    { slug: "honda-cb500f-2023", name: "Honda CB500F 2023", year: 2023, trimName: null,
      imageUrl: IMG("2021_Honda_CB500F.jpg"),
      modelId: modelCB500F.id, brandId: honda.id,
      attributes: { fuel_type: "GASOLINE", moto_type: "naked", engine_cc: 471, power_hp: 47 } },
    { slug: "honda-nc750x-2023", name: "Honda NC750X 2023", year: 2023, trimName: "DCT",
      imageUrl: IMG("2021_Honda_NC750X_(DCT).jpg"),
      modelId: modelNC750X.id, brandId: honda.id,
      attributes: { fuel_type: "GASOLINE", moto_type: "adventure", engine_cc: 745, power_hp: 58 } },
    { slug: "yamaha-mt07-2023", name: "Yamaha MT-07 2023", year: 2023, trimName: null,
      imageUrl: IMG("2021_Black_Yamaha_MT-07.jpg"),
      modelId: modelMT07.id, brandId: yamaha.id,
      attributes: { fuel_type: "GASOLINE", moto_type: "naked", engine_cc: 689, power_hp: 73 } },
    { slug: "yamaha-tracer-9-gt-2023", name: "Yamaha Tracer 9 GT 2023", year: 2023, trimName: "GT+",
      imageUrl: IMG("2022_Yamaha_Tracer9_GT.jpg"),
      modelId: modelTracer9.id, brandId: yamaha.id,
      attributes: { fuel_type: "GASOLINE", moto_type: "touring", engine_cc: 889, power_hp: 119 } },
    { slug: "kawasaki-z650-2023", name: "Kawasaki Z650 2023", year: 2023, trimName: null,
      imageUrl: IMG("Kawasaki_Z650_schwarz_2020.jpg"),
      modelId: modelZ650.id, brandId: kawasaki.id,
      attributes: { fuel_type: "GASOLINE", moto_type: "naked", engine_cc: 649, power_hp: 68 } },
    { slug: "kawasaki-ninja-400-2023", name: "Kawasaki Ninja 400 2023", year: 2023, trimName: null,
      imageUrl: IMG("Kawasaki_Ninja_400_KRT_Edition_(facelift_model)_right_side.jpg"),
      modelId: modelNinja400.id, brandId: kawasaki.id,
      attributes: { fuel_type: "GASOLINE", moto_type: "sport", engine_cc: 399, power_hp: 45 } },
    { slug: "zero-sr-s-2024", name: "Zero SR/S 2024", year: 2024, trimName: "Premium",
      imageUrl: IMG("Zero_SRS_Detail.jpg"),
      modelId: modelZeroSRS.id, brandId: zeromotorcycles.id,
      attributes: { fuel_type: "EV", moto_type: "elektrikli", ev_range_km: 259, power_hp: 110 } },
  ];

  for (const p of motoProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { imageUrl: p.imageUrl },
      create: { ...p, categoryId: catMotosiklet.id },
    });
  }

  // ─────────────────────────────────────────────
  // ÜRÜNLER — E-Scooter / E-Bisiklet
  // ─────────────────────────────────────────────

  const escooterProducts = [
    { slug: "xiaomi-mi-4-pro-2023", name: "Xiaomi Mi Electric Scooter 4 Pro 2023", year: 2023, trimName: null,
      imageUrl: IMG("Xiaomi_Pro_2.jpg"),
      modelId: modelXiaomi4Pro.id, brandId: xiaomi.id,
      attributes: { scooter_type: "e-scooter", motor_watt: 700, range_km: 55, max_speed_kmh: 25, battery_wh: 446 } },
    { slug: "niu-kqi3-max-2023", name: "NIU KQi3 Max 2023", year: 2023, trimName: null,
      imageUrl: IMG("Elektrische-tretroller.jpg"),
      modelId: modelNiuKqi3.id, brandId: niu.id,
      attributes: { scooter_type: "e-scooter", motor_watt: 700, range_km: 80, max_speed_kmh: 35, battery_wh: 608 } },
    { slug: "segway-ninebot-max-g30-2022", name: "Segway Ninebot Max G30 2022", year: 2022, trimName: "G30P",
      imageUrl: IMG("Xiaomi_Essential-1S.jpg"),
      modelId: modelNinebot.id, brandId: segway.id,
      attributes: { scooter_type: "e-scooter", motor_watt: 350, range_km: 65, max_speed_kmh: 25, battery_wh: 551 } },
  ];

  for (const p of escooterProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { imageUrl: p.imageUrl },
      create: { ...p, categoryId: catEscooter.id },
    });
  }

  // ─────────────────────────────────────────────
  // ÜRÜNLER — Karavan
  // ─────────────────────────────────────────────

  const karavanProducts = [
    { slug: "knaus-sport-400-lk-2023", name: "Knaus Sport 400 LK 2023", year: 2023, trimName: null,
      imageUrl: IMG("Knaus_Ski_I_PMS14.jpg"),
      modelId: modelKnausSport.id, brandId: knaus.id,
      attributes: { karavan_type: "cekme", berth: 4, length_cm: 735, tow_weight_kg: 1290 } },
    { slug: "adria-altea-432-px-2023", name: "Adria Altea 432 PX 2023", year: 2023, trimName: null,
      imageUrl: IMG("Adria_Altea_390_PS_r.jpg"),
      modelId: modelAdriaAltea.id, brandId: adria.id,
      attributes: { karavan_type: "cekme", berth: 4, length_cm: 780, tow_weight_kg: 1350 } },
    { slug: "kiral-k350-2023", name: "Kıral Karavan K350 2023", year: 2023, trimName: null,
      imageUrl: IMG("Wohnwagen.jpg"),
      modelId: modelKiralK350.id, brandId: kiralkaravan.id,
      attributes: { karavan_type: "cekme", berth: 4, length_cm: 700, tow_weight_kg: 1100 } },
  ];

  for (const p of karavanProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { imageUrl: p.imageUrl },
      create: { ...p, categoryId: catKaravan.id },
    });
  }

  // ─────────────────────────────────────────────
  // ÜRÜNLER — Kamyonet / Pickup
  // ─────────────────────────────────────────────

  const kamyonetProducts = [
    { slug: "ford-ranger-2023", name: "Ford Ranger 2023", year: 2023, trimName: "Wildtrak",
      imageUrl: IMG("2023_Ford_Ranger_Wildtrak_EcoBlue_4x4_Auto.jpg"),
      modelId: modelRanger.id, brandId: ford.id,
      attributes: { fuel_type: "DIESEL", body_type: "pickup", payload_kg: 1030, engine_cc: 2000, power_hp: 170, four_wd: true } },
    { slug: "ford-ranger-2024", name: "Ford Ranger 2024", year: 2024, trimName: "Raptor",
      imageUrl: IMG("2023_Ford_Ranger_Raptor_Ecoboost_Auto.jpg"),
      modelId: modelRanger.id, brandId: ford.id,
      attributes: { fuel_type: "DIESEL", body_type: "pickup", payload_kg: 925, engine_cc: 3000, power_hp: 240, four_wd: true } },
    { slug: "ford-transit-custom-2023", name: "Ford Transit Custom 2023", year: 2023, trimName: "Trend",
      imageUrl: IMG("Ford_Transit_Custom_(2023)_1X7A1645.jpg"),
      modelId: modelTransit.id, brandId: ford.id,
      attributes: { fuel_type: "DIESEL", body_type: "van", payload_kg: 1186, engine_cc: 2000, power_hp: 136, four_wd: false } },
    { slug: "toyota-hilux-2023", name: "Toyota Hilux 2023", year: 2023, trimName: "Adventure",
      imageUrl: IMG("2023_Toyota_Hilux_Champ_2.4_Diesel_LWB.jpg"),
      modelId: modelHilux.id, brandId: toyota.id,
      attributes: { fuel_type: "DIESEL", body_type: "pickup", payload_kg: 1080, engine_cc: 2755, power_hp: 204, four_wd: true } },
    { slug: "vw-amarok-2023", name: "Volkswagen Amarok 2023", year: 2023, trimName: "PanAmericana",
      imageUrl: IMG("Volkswagen_Amarok_Mk2_Caflisch_Auto_Zuerich_2023_1X7A1440.jpg"),
      modelId: modelAmarok.id, brandId: volkswagen.id,
      attributes: { fuel_type: "DIESEL", body_type: "pickup", payload_kg: 1160, engine_cc: 3000, power_hp: 240, four_wd: true } },
    { slug: "isuzu-d-max-2023", name: "Isuzu D-Max 2023", year: 2023, trimName: "V-Cross",
      imageUrl: IMG("2023_Isuzu_D-Max_V-Cross_4-Door_3.0_Ddi_M.jpg"),
      modelId: modelDMax.id, brandId: isuzu.id,
      attributes: { fuel_type: "DIESEL", body_type: "pickup", payload_kg: 1105, engine_cc: 1898, power_hp: 164, four_wd: true } },
    { slug: "mitsubishi-l200-2023", name: "Mitsubishi L200 2023", year: 2023, trimName: "Athlete",
      imageUrl: IMG("Mitsubishi_L200_4WD.JPG"),
      modelId: modelL200.id, brandId: mitsubishi.id,
      attributes: { fuel_type: "DIESEL", body_type: "pickup", payload_kg: 1100, engine_cc: 2268, power_hp: 150, four_wd: true } },
  ];

  for (const p of kamyonetProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { trimName: p.trimName, imageUrl: p.imageUrl },
      create: { ...p, categoryId: catKamyonet.id },
    });
  }

  console.log("✓ Ürünler oluşturuldu");

  // ─────────────────────────────────────────────
  // TREND — Demo viewCount değerleri
  // ─────────────────────────────────────────────

  const trendData = [
    { slug: "togg-t10x-2024",           viewCount: 2840 },
    { slug: "ford-ranger-2024",          viewCount: 2210 },
    { slug: "yamaha-mt07-2023",          viewCount: 1870 },
    { slug: "tesla-model-y-2024",        viewCount: 1650 },
    { slug: "xiaomi-mi-4-pro-2023",      viewCount: 1420 },
    { slug: "toyota-hilux-2023",         viewCount: 1380 },
    { slug: "kawasaki-ninja-400-2023",   viewCount: 1200 },
    { slug: "dacia-duster-2024",         viewCount: 1090 },
    { slug: "knaus-sport-400-lk-2023",   viewCount:  880 },
    { slug: "zero-sr-s-2024",            viewCount:  760 },
  ];

  for (const { slug, viewCount } of trendData) {
    await prisma.product.update({ where: { slug }, data: { viewCount } });
  }

  console.log("✓ Trend viewCount'lar set edildi");
  console.log("\n🎉 Seed tamamlandı!");
  console.log("   Kategoriler : 6");
  console.log("   Markalar    : 20");
  console.log("   Modeller    : 29");
  console.log("   Ürünler     : 13 araba + 7 motosiklet + 3 e-scooter + 3 karavan + 7 kamyonet = 33");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
