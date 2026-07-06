import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { rateLimitByIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const contentType = "image/png";

const RATE_LIMIT_COUNT = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const size = { width: 220, height: 64 };

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!rateLimitByIp(req, "public-skor-badge", RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_MS)) {
    return new Response("Çok fazla istek", { status: 429 });
  }

  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: { id: true, model: { select: { name: true } } },
  });

  const agg = product
    ? await prisma.review.aggregate({
        where: { productId: product.id, status: "PUBLISHED" },
        _avg: { scoreOverall: true },
        _count: { id: true },
      })
    : null;

  const reviewCount = agg?._count.id ?? 0;
  const score = reviewCount > 0 ? (agg!._avg.scoreOverall ?? 0) : null;

  const img = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#111",
          borderRadius: 10,
          padding: "0 16px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", fontSize: 12, color: "#777" }}>fikape.com</div>
          <div
            style={{
              display: "flex",
              fontSize: 14,
              color: "#fff",
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {product ? product.model.name : "Araç bulunamadı"}
          </div>
        </div>
        {score !== null ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginLeft: 12 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#85B7EB" }}>{score.toFixed(1)}</span>
            <span style={{ fontSize: 12, color: "#666" }}>/10</span>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 11, color: "#666", marginLeft: 12 }}>Veri birikiyor</div>
        )}
      </div>
    ),
    { ...size }
  );

  img.headers.set("Access-Control-Allow-Origin", "*");
  img.headers.set("Cache-Control", "public, max-age=3600");
  return img;
}
