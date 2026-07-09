import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { CHIP_LABEL } from "@/lib/chips";

export const runtime = "nodejs";

const size = { width: 1080, height: 1920 };
const QUOTE_MAX_CHARS = 260;
const MAX_CHIPS = 5;
const MAX_PROS = 3;

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

function ChipPill({ label, positive }: { label: string; positive: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 999,
        fontSize: 22,
        fontWeight: 700,
        background: positive ? "rgba(151,196,89,0.15)" : "rgba(240,153,123,0.15)",
        color: positive ? "#97C459" : "#F0997B",
      }}
    >
      <span>{positive ? "+" : "−"}</span>
      <span>{label}</span>
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
          detailText: true,
          extendedData: true,
          scoreFiyat: true,
          scoreKalite: true,
          scorePerformans: true,
          scoreOverall: true,
          status: true,
          user: { select: { displayName: true, trustLevel: true } },
          product: {
            select: {
              slug: true,
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

  const fullText = [review.summaryText, review.detailText].filter(Boolean).join(" ");
  const truncated = fullText.length > QUOTE_MAX_CHARS;
  const quote = truncated ? fullText.slice(0, QUOTE_MAX_CHARS).trimEnd() : fullText;

  const extended = (review.extendedData as Record<string, unknown> | null) ?? {};
  const pros = ((extended.pros as string[] | undefined) ?? []).map((k) => CHIP_LABEL[k] ?? k);
  const cons = ((extended.cons as string[] | undefined) ?? []).map((k) => CHIP_LABEL[k] ?? k);
  const shownPros = pros.slice(0, MAX_PROS);
  const shownCons = cons.slice(0, Math.max(0, MAX_CHIPS - shownPros.length));
  const hasChips = shownPros.length > 0 || shownCons.length > 0;

  const productUrl = `https://fikape.com/araclar/${review.product.slug}`;
  const qrDataUrl = await QRCode.toDataURL(productUrl, {
    width: 220,
    margin: 0,
    color: { dark: "#111111", light: "#ffffff" },
  });

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

        {/* Chip'ler — artılar solda, eksiler sağda */}
        {hasChips && (
          <div style={{ display: "flex", marginTop: 60, gap: 24 }}>
            <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 10 }}>
              {shownPros.map((label) => (
                <ChipPill key={label} label={label} positive />
              ))}
            </div>
            <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 10 }}>
              {shownCons.map((label) => (
                <ChipPill key={label} label={label} positive={false} />
              ))}
            </div>
          </div>
        )}

        {/* Quote */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 60,
            fontSize: 34,
            color: "#ccc",
            lineHeight: 1.4,
            borderLeft: "4px solid #333",
            paddingLeft: 28,
          }}
        >
          <span>
            &quot;{quote}
            {truncated ? "…" : ""}&quot;
          </span>
          {truncated && (
            <span style={{ fontSize: 24, color: "#666", marginTop: 10 }}>Devamı var →</span>
          )}
        </div>

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Alt satır: reviewer/footer solda, QR sağ altta */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: "#fff" }}>{reviewerName}</span>
            {isOwner && (
              <span style={{ fontSize: 22, color: "#97C459", marginTop: 6 }}>
                Doğrulanmış Sahip
              </span>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24 }}>
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

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                width: 150,
                height: 150,
                background: "#fff",
                borderRadius: 16,
                padding: 12,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} width={126} height={126} alt="" />
            </div>
            <span style={{ fontSize: 20, color: "#666", marginTop: 10 }}>Kartı okut →</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
