import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { stripModelGenRange } from "@/lib/modelDisplay";

export const runtime = "nodejs";
export const alt = "fikape araç yorumları";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function ScoreBar({
  label,
  score,
  color,
  bg,
}: {
  label: string;
  score: number;
  color: string;
  bg: string;
}) {
  const pct = Math.round((score / 10) * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 18, color: "#999" }}>{label}</span>
        <span style={{ fontSize: 28, fontWeight: 900, color }}>{score.toFixed(1)}</span>
      </div>
      <div style={{ height: 10, background: "#222", borderRadius: 6, width: "100%", display: "flex" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 6,
            opacity: 0.85,
          }}
        />
      </div>
    </div>
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      year: true,
      brand: { select: { name: true } },
      model: { select: { name: true } },
    },
  });

  if (!product) {
    return new ImageResponse(
      <div
        style={{
          background: "#111",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          color: "#fff",
        }}
      >
        fikape
      </div>,
      { ...size }
    );
  }

  const agg = await prisma.review.aggregate({
    where: { productId: product.id, status: "PUBLISHED" },
    _avg: {
      scoreFiyat: true,
      scoreKalite: true,
      scorePerformans: true,
      scoreOverall: true,
    },
    _count: { id: true },
  });

  const hasScores = agg._count.id > 0;
  const fi = agg._avg.scoreFiyat ?? 0;
  const ka = agg._avg.scoreKalite ?? 0;
  const pe = agg._avg.scorePerformans ?? 0;
  const overall = agg._avg.scoreOverall ?? 0;
  const count = agg._count.id;

  const vehicleName = `${product.brand.name} ${stripModelGenRange(product.model.name)}`;
  const yearStr = product.year ? ` ${product.year}` : "";

  return new ImageResponse(
    <div
      style={{
        background: "#111",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "60px 80px",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
        <span style={{ fontSize: 32, fontWeight: 900, color: "#85B7EB" }}>fi</span>
        <span style={{ fontSize: 32, fontWeight: 300, color: "#333", margin: "0 3px" }}>·</span>
        <span style={{ fontSize: 32, fontWeight: 900, color: "#97C459" }}>ka</span>
        <span style={{ fontSize: 32, fontWeight: 300, color: "#333", margin: "0 3px" }}>·</span>
        <span style={{ fontSize: 32, fontWeight: 900, color: "#F0997B" }}>pe</span>
      </div>

      {/* Content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          gap: 80,
          marginTop: 40,
        }}
      >
        {/* Left: vehicle info */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              fontSize: 20,
              color: "#666",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {product.brand.name}
          </div>
          <div
            style={{
              fontSize: 58,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.1,
              marginBottom: 8,
              letterSpacing: "-1.5px",
            }}
          >
            {stripModelGenRange(product.model.name)}
            {yearStr && (
              <span style={{ color: "#555", fontWeight: 400, fontSize: 44 }}>{yearStr}</span>
            )}
          </div>

          {hasScores ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                {overall.toFixed(1)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", marginLeft: 4 }}>
                <span style={{ fontSize: 15, color: "#666" }}>/ 10</span>
                <span style={{ fontSize: 15, color: "#555" }}>
                  {count} yorum
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 20, color: "#555", marginTop: 20 }}>
              Henüz yorum yok — ilk yorumu sen yaz
            </div>
          )}
        </div>

        {/* Right: score bars */}
        {hasScores && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 340,
              gap: 24,
            }}
          >
            <ScoreBar label="Fiyat"      score={fi} color="#85B7EB" bg="#85B7EB22" />
            <ScoreBar label="Kalite"     score={ka} color="#97C459" bg="#97C45922" />
            <ScoreBar label="Performans" score={pe} color="#F0997B" bg="#F0997B22" />
          </div>
        )}
      </div>

      {/* Bottom tagline */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 32 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#85B7EB",
          }}
        />
        <span style={{ fontSize: 16, color: "#444" }}>
          Gerçek kullanıcı yorumları — fikape.com
        </span>
      </div>
    </div>,
    { ...size }
  );
}
