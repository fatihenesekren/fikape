import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seed başlıyor...");

  // ─────────────────────────────────────────────
  // KATEGORİLER
  // ─────────────────────────────────────────────

  const catAraclar = await prisma.category.upsert({
    where: { slug: "araclar" },
    update: {},
    create: {
      slug: "araclar",
      name: "Araçlar",
      sortOrder: 1,
      attributeSchema: {},
      reviewFormSchema: [],
    },
  });

  const catOtomobil = await prisma.category.upsert({
    where: { slug: "otomobil" },
    update: {},
    create: {
      slug: "otomobil",
      name: "Otomobil",
      parentId: catAraclar.id,
      sortOrder: 1,
      // İçten yanmalı araçlar için ortak özellik şeması
      attributeSchema: {
        fuel_type: { type: "enum", values: ["GASOLINE", "DIESEL", "LPG", "HYBRID", "EV"], label: "Yakıt Tipi" },
        segment: { type: "enum", values: ["A", "B", "C", "D", "E", "SUV"], label: "Segment" },
        body_type: { type: "enum", values: ["sedan", "hatchback", "suv", "mpv", "coupe", "cabrio"], label: "Kasa Tipi" },
        engine_cc: { type: "number", label: "Motor Hacmi (cc)", nullable: true },
        power_hp: { type: "number", label: "Güç (HP)", nullable: true },
        ev_range_km: { type: "number", label: "Menzil (km) - Yalnızca EV", nullable: true },
      },
      // ICE araç yorum soruları
      reviewFormSchema: [
        { key: "real_fuel_per_100km", label: "Gerçek yakıt tüketimi (L/100km)", type: "number", forFuelTypes: ["GASOLINE", "DIESEL", "LPG"] },
        { key: "has_lpg", label: "LPG dönüşümü yaptırdınız mı?", type: "boolean", forFuelTypes: ["GASOLINE"] },
        { key: "lpg_monthly_cost", label: "Aylık LPG yakıt maliyeti (₺)", type: "number", forFuelTypes: ["LPG"] },
        { key: "real_range_km", label: "Gerçek menzil (km) - Tek şarjda", type: "number", forFuelTypes: ["EV"] },
        { key: "winter_range_km", label: "Kışın gerçek menzil (km)", type: "number", forFuelTypes: ["EV"] },
        { key: "monthly_charge_cost", label: "Aylık şarj maliyeti (₺)", type: "number", forFuelTypes: ["EV"] },
        { key: "score_charging", label: "Şarj altyapısı puanı (1-5)", type: "rating", forFuelTypes: ["EV"] },
        { key: "charging_time_min", label: "0→%80 şarj süresi (dakika)", type: "number", forFuelTypes: ["EV"] },
        { key: "score_comfort", label: "Konfor puanı (1-5)", type: "rating", forFuelTypes: ["ALL"] },
        { key: "score_infotainment", label: "Multimedya/teknoloji puanı (1-5)", type: "rating", forFuelTypes: ["ALL"] },
        { key: "score_build_quality", label: "Yapı kalitesi puanı (1-5)", type: "rating", forFuelTypes: ["ALL"] },
        { key: "service_experience", label: "Yetkili servis deneyimi", type: "text", forFuelTypes: ["ALL"] },
        { key: "would_recommend_dealer", label: "Bayinizi tavsiye eder misiniz?", type: "boolean", forFuelTypes: ["ALL"] },
      ],
    },
  });

  await prisma.category.upsert({
    where: { slug: "motosiklet" },
    update: {},
    create: {
      slug: "motosiklet",
      name: "Motosiklet",
      parentId: catAraclar.id,
      sortOrder: 2,
      attributeSchema: {
        engine_cc: { type: "number", label: "Motor Hacmi (cc)" },
        power_hp: { type: "number", label: "Güç (HP)" },
        type: { type: "enum", values: ["naked", "sport", "touring", "enduro", "scooter", "custom"], label: "Tip" },
        fuel_type: { type: "enum", values: ["GASOLINE", "EV"], label: "Yakıt Tipi" },
      },
      reviewFormSchema: [
        { key: "real_fuel_per_100km", label: "Gerçek yakıt tüketimi (L/100km)", type: "number" },
        { key: "score_handling", label: "Sürüş kabiliyeti (1-5)", type: "rating" },
        { key: "score_comfort", label: "Konfor (1-5)", type: "rating" },
        { key: "wind_protection", label: "Rüzgar koruması yeterli mi?", type: "boolean" },
      ],
    },
  });

  console.log("✓ Kategoriler oluşturuldu");

  // ─────────────────────────────────────────────
  // MARKALAR
  // ─────────────────────────────────────────────

  const brands = await Promise.all([
    prisma.brand.upsert({ where: { slug: "togg" }, update: {}, create: { slug: "togg", name: "Togg" } }),
    prisma.brand.upsert({ where: { slug: "tesla" }, update: {}, create: { slug: "tesla", name: "Tesla" } }),
    prisma.brand.upsert({ where: { slug: "fiat" }, update: {}, create: { slug: "fiat", name: "Fiat" } }),
    prisma.brand.upsert({ where: { slug: "renault" }, update: {}, create: { slug: "renault", name: "Renault" } }),
    prisma.brand.upsert({ where: { slug: "dacia" }, update: {}, create: { slug: "dacia", name: "Dacia" } }),
  ]);

  const [togg, tesla, fiat, renault, dacia] = brands;
  console.log("✓ Markalar oluşturuldu");

  // ─────────────────────────────────────────────
  // MODELLER
  // ─────────────────────────────────────────────

  const modelT10X = await prisma.model.upsert({ where: { slug: "togg-t10x" }, update: {}, create: { slug: "togg-t10x", name: "T10X", brandId: togg.id } });
  const modelT10F = await prisma.model.upsert({ where: { slug: "togg-t10f" }, update: {}, create: { slug: "togg-t10f", name: "T10F", brandId: togg.id } });
  const modelModelY = await prisma.model.upsert({ where: { slug: "tesla-model-y" }, update: {}, create: { slug: "tesla-model-y", name: "Model Y", brandId: tesla.id } });
  const modelEgea = await prisma.model.upsert({ where: { slug: "fiat-egea" }, update: {}, create: { slug: "fiat-egea", name: "Egea", brandId: fiat.id } });
  const modelClio = await prisma.model.upsert({ where: { slug: "renault-clio" }, update: {}, create: { slug: "renault-clio", name: "Clio", brandId: renault.id } });
  const modelDuster = await prisma.model.upsert({ where: { slug: "dacia-duster" }, update: {}, create: { slug: "dacia-duster", name: "Duster", brandId: dacia.id } });

  console.log("✓ Modeller oluşturuldu");

  // ─────────────────────────────────────────────
  // ÜRÜNLER (yıl bazlı varyantlar)
  // ─────────────────────────────────────────────

  const products = [
    // EV — Togg T10X
    { slug: "togg-t10x-2023", name: "Togg T10X 2023", year: 2023, trimName: "Uzun Menzil",
      modelId: modelT10X.id, brandId: togg.id,
      attributes: { fuel_type: "EV", segment: "C", body_type: "suv", ev_range_km: 523, power_hp: 200 } },
    { slug: "togg-t10x-2024", name: "Togg T10X 2024", year: 2024, trimName: "Uzun Menzil",
      modelId: modelT10X.id, brandId: togg.id,
      attributes: { fuel_type: "EV", segment: "C", body_type: "suv", ev_range_km: 523, power_hp: 200 } },

    // EV — Togg T10F
    { slug: "togg-t10f-2024", name: "Togg T10F 2024", year: 2024, trimName: "Standart Menzil",
      modelId: modelT10F.id, brandId: togg.id,
      attributes: { fuel_type: "EV", segment: "C", body_type: "sedan", ev_range_km: 480, power_hp: 200 } },

    // EV — Tesla Model Y
    { slug: "tesla-model-y-2023", name: "Tesla Model Y 2023", year: 2023, trimName: "Long Range AWD",
      modelId: modelModelY.id, brandId: tesla.id,
      attributes: { fuel_type: "EV", segment: "D", body_type: "suv", ev_range_km: 533, power_hp: 299 } },
    { slug: "tesla-model-y-2024", name: "Tesla Model Y 2024", year: 2024, trimName: "Long Range RWD",
      modelId: modelModelY.id, brandId: tesla.id,
      attributes: { fuel_type: "EV", segment: "D", body_type: "suv", ev_range_km: 533, power_hp: 299 } },

    // C Segment — Fiat Egea Sedan
    { slug: "fiat-egea-sedan-2020", name: "Fiat Egea Sedan 2020", year: 2020, trimName: "Urban",
      modelId: modelEgea.id, brandId: fiat.id,
      attributes: { fuel_type: "GASOLINE", segment: "C", body_type: "sedan", engine_cc: 1368, power_hp: 95 } },
    { slug: "fiat-egea-sedan-2022", name: "Fiat Egea Sedan 2022", year: 2022, trimName: "Urban",
      modelId: modelEgea.id, brandId: fiat.id,
      attributes: { fuel_type: "GASOLINE", segment: "C", body_type: "sedan", engine_cc: 1368, power_hp: 95 } },
    { slug: "fiat-egea-sedan-2024", name: "Fiat Egea Sedan 2024", year: 2024, trimName: "Lounge",
      modelId: modelEgea.id, brandId: fiat.id,
      attributes: { fuel_type: "GASOLINE", segment: "C", body_type: "sedan", engine_cc: 1368, power_hp: 95 } },

    // B Segment — Renault Clio
    { slug: "renault-clio-2021", name: "Renault Clio 2021", year: 2021, trimName: "Touch",
      modelId: modelClio.id, brandId: renault.id,
      attributes: { fuel_type: "GASOLINE", segment: "B", body_type: "hatchback", engine_cc: 999, power_hp: 90 } },
    { slug: "renault-clio-2023", name: "Renault Clio 2023", year: 2023, trimName: "Techno",
      modelId: modelClio.id, brandId: renault.id,
      attributes: { fuel_type: "GASOLINE", segment: "B", body_type: "hatchback", engine_cc: 999, power_hp: 90 } },
    { slug: "renault-clio-hybrid-2023", name: "Renault Clio Hybrid 2023", year: 2023, trimName: "E-Tech Techno",
      modelId: modelClio.id, brandId: renault.id,
      attributes: { fuel_type: "HYBRID", segment: "B", body_type: "hatchback", engine_cc: 1598, power_hp: 145 } },

    // SUV — Dacia Duster
    { slug: "dacia-duster-2021", name: "Dacia Duster 2021", year: 2021, trimName: "Comfort",
      modelId: modelDuster.id, brandId: dacia.id,
      attributes: { fuel_type: "GASOLINE", segment: "SUV", body_type: "suv", engine_cc: 999, power_hp: 90 } },
    { slug: "dacia-duster-2024", name: "Dacia Duster 2024", year: 2024, trimName: "Extreme",
      modelId: modelDuster.id, brandId: dacia.id,
      attributes: { fuel_type: "GASOLINE", segment: "SUV", body_type: "suv", engine_cc: 999, power_hp: 90 } },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { trimName: p.trimName },
      create: { ...p, categoryId: catOtomobil.id },
    });
  }

  console.log("✓ Ürünler oluşturuldu (13 araç)");
  console.log("\n🎉 Seed tamamlandı!");
  console.log("   Kategoriler : 3 (Araçlar, Otomobil, Motosiklet)");
  console.log("   Markalar    : 5 (Togg, Tesla, Fiat, Renault, Dacia)");
  console.log("   Modeller    : 6 (T10X, T10F, Model Y, Egea, Clio, Duster)");
  console.log("   Ürünler     : 13 araç (yıl bazlı varyantlar)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
