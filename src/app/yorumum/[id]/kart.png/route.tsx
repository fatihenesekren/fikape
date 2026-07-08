import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { stripModelGenRange } from "@/lib/modelDisplay";

export const runtime = "nodejs";

const size = { width: 1080, height: 1920 };

function ScoreRow({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  const pct = Math.round((score / 10) * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 30, color: "#999" }}>{label}</span>
        <span style={{ fontSize: 40, fontWeight: 900, color }}>{score.toFixed(1)}</span>
      </div>
      <div style={{ height: 16, background: "#222", borderRadius: 8, width: "100%", display: "flex" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 8,
            opacity: 0.85,
          }}
        />
      </div>
    </div>
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reviewId = parseInt(id);

  const review = isNaN(reviewId)
    ? null
    : await prisma.review.findUnique({
        where: { id: reviewId },
        select: {
          summaryText: true,
          scoreFiyat: true,
          scoreKalite: true,
          scorePerformans: true,
          scoreOverall: true,
          status: true,
          user: { select: { displayName: true, trustLevel: true } },
          product: {
            select: {
              year: true,
              brand: { select: { name: true } },
              model: { select: { name: true } },
            },
          },
        },
      });

  if (!review || review.status !== "PUBLISHED") {
    return new ImageResponse(
      (
        <div
          style={{
            background: "#111",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 60,
            color: "#fff",
          }}
        >
          fikape
        </div>
      ),
      { ...size }
    );
  }

  const vehicleName = `${review.product.brand.name} ${stripModelGenRange(review.product.model.name)}`;
  const yearStr = review.product.year ? ` ${review.product.year}` : "";
  const isOwner = review.user.trustLevel >= 3;
  const reviewerName = review.user.displayName ?? "fikape kullanıcısı";
  const quote =
    review.summaryText.length > 140
      ? `${review.summaryText.slice(0, 140)}…`
      : review.summaryText;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#111",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "90px 70px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
          <span style={{ fontSize: 44, fontWeight: 900, color: "#85B7EB" }}>fi</span>
          <span style={{ fontSize: 44, fontWeight: 300, color: "#333", margin: "0 4px" }}>·</span>
          <span style={{ fontSize: 44, fontWeight: 900, color: "#97C459" }}>ka</span>
          <span style={{ fontSize: 44, fontWeight: 300, color: "#333", margin: "0 4px" }}>·</span>
          <span style={{ fontSize: 44, fontWeight: 900, color: "#F0997B" }}>pe</span>
        </div>

        {/* Vehicle */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 90 }}>
          <div
            style={{
              fontSize: 28,
              color: "#666",
              marginBottom: 14,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {review.product.brand.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 66,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
            }}
          >
            {stripModelGenRange(review.product.model.name)}
            {yearStr && (
              <span style={{ color: "#555", fontWeight: 400, fontSize: 50 }}>{yearStr}</span>
            )}
          </div>
        </div>

        {/* Overall score */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 56 }}>
          <div style={{ fontSize: 130, fontWeight: 900, color: "#fff" }}>
            {review.scoreOverall.toFixed(1)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 4 }}>
            <span style={{ fontSize: 26, color: "#666" }}>/ 10</span>
            <span style={{ fontSize: 22, color: "#555" }}>benim puanım</span>
          </div>
        </div>

        {/* Score bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 36, marginTop: 70 }}>
          <ScoreRow label="Fiyat" score={review.scoreFiyat} color="#85B7EB" />
          <ScoreRow label="Kalite" score={review.scoreKalite} color="#97C459" />
          <ScoreRow label="Performans" score={review.scorePerformans} color="#F0997B" />
        </div>

        {/* Quote */}
        <div
          style={{
            display: "flex",
            marginTop: 70,
            fontSize: 34,
            color: "#ccc",
            lineHeight: 1.4,
            borderLeft: "4px solid #333",
            paddingLeft: 28,
          }}
        >
          &quot;{quote}&quot;
        </div>

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Reviewer */}
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 40 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: "#fff" }}>{reviewerName}</span>
          {isOwner && (
            <span style={{ fontSize: 22, color: "#97C459", marginTop: 6 }}>
              Doğrulanmış Sahip
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#85B7EB",
            }}
          />
          <span style={{ fontSize: 24, color: "#444" }}>
            Gerçek kullanıcı yorumları — fikape.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
