import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { fetchAndResizeImage } from "@/lib/imageResize";
import { getInitials, getAvatarColor } from "@/lib/avatar";
import { FIKAPE_SOFT } from "@/lib/fikape";
import { EXPERT_BADGE } from "@/lib/expertNote";
import { BASE_URL } from "@/lib/baseUrl";

export const runtime = "nodejs";

const size = { width: 1080, height: 1920 };

function fallbackCard() {
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

async function avatarDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  const resized = await fetchAndResizeImage(url);
  if (!resized) return null;
  return `data:${resized.contentType};base64,${resized.buffer.toString("base64")}`;
}

// Satori (next/og) `-webkit-line-clamp`'i desteklemiyor — "…" ile kelime
// sınırında elle kırpıyoruz (bkz. 3 uzman denetimi, 2026-09-22).
function truncateAtWord(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).replace(/\s+\S*$/, "") + "…";
}

function getProfile(slug: string) {
  return prisma.expertProfile.findUnique({
    where: { slug },
    select: {
      headline: true,
      city: true,
      district: true,
      expertiseTags: true,
      createdAt: true,
      status: true,
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      _count: { select: { notes: { where: { status: "PUBLISHED", removedAt: null } } } },
      // Kart "çok sığ" duruyordu (bkz. kullanıcı geri bildirimi) — en son
      // yayınlanan notun kısa bir kesiti "Devamını oku" tarzı bir çekim
      // noktası olsun diye eklendi. Basit ve performanslı: en son yayınlanan
      // (publishedAt indexli), popülerlik/oy sıralaması ek karmaşıklık
      // gerektiriyordu.
      notes: {
        where: { status: "PUBLISHED", removedAt: null },
        orderBy: { publishedAt: "desc" },
        take: 1,
        select: { title: true, body: true },
      },
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const profile = await getProfile(slug);

  if (!profile || profile.status !== "ACTIVE") {
    return fallbackCard();
  }

  try {
    return await renderCard(slug, profile);
  } catch (e) {
    console.error("[usta kart.png]", e);
    return fallbackCard();
  }
}

async function renderCard(slug: string, profile: NonNullable<Awaited<ReturnType<typeof getProfile>>>) {
  const headline = profile.headline ?? "Usta";
  const displayName = profile.user.displayName ?? "fikape kullanıcısı";
  const location = [profile.city, profile.district].filter(Boolean).join(" / ");
  const memberSince = profile.createdAt.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const tags = profile.expertiseTags.slice(0, 5);
  const latestNote = profile.notes[0] ?? null;
  const noteExcerpt = latestNote ? truncateAtWord(latestNote.body.trim(), 150) : null;

  const profileUrl = `${BASE_URL}/usta/${slug}`;
  const qrDataUrl = await QRCode.toDataURL(profileUrl, {
    width: 220,
    margin: 0,
    color: { dark: "#111111", light: "#ffffff" },
  });

  const avatarUrl = await avatarDataUrl(profile.user.avatarUrl);
  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(String(profile.user.id));

  return new ImageResponse(
    (
      <div
        style={{
          background: `radial-gradient(circle at 15% 0%, ${EXPERT_BADGE.color}33 0%, #111 45%)`,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "90px 70px",
          position: "relative",
        }}
      >
        {/* Dev, soluk halka motifi — tamamen düz siyah zemin "boş/sıkıcı"
            duruyordu (bkz. görsel tasarım denetimi, 2026-09-22). */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -180,
            right: -220,
            width: 760,
            height: 760,
          }}
        >
          {[
            { c: FIKAPE_SOFT.fi, r: 0 },
            { c: FIKAPE_SOFT.pe, r: 120 },
            { c: FIKAPE_SOFT.ka, r: 240 },
          ].map(({ c, r }) => (
            <div
              key={r}
              style={{
                position: "absolute",
                width: 760,
                height: 760,
                borderRadius: 760,
                border: "36px solid transparent",
                borderTopColor: c,
                opacity: 0.07,
                transform: `rotate(${r}deg)`,
              }}
            />
          ))}
        </div>

        {/* Logo — segmentli halka işareti + wordmark (review kartıyla aynı) */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ display: "flex", position: "relative", width: 54, height: 54 }}>
            {[
              { c: FIKAPE_SOFT.fi, r: 0 },
              { c: FIKAPE_SOFT.pe, r: 120 },
              { c: FIKAPE_SOFT.ka, r: 240 },
            ].map(({ c, r }) => (
              <div
                key={r}
                style={{
                  position: "absolute",
                  width: 54,
                  height: 54,
                  borderRadius: 54,
                  border: "9px solid transparent",
                  borderTopColor: c,
                  transform: `rotate(${r}deg)`,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: FIKAPE_SOFT.fi }}>fi</span>
            <span style={{ fontSize: 44, fontWeight: 300, color: "#333", margin: "0 4px" }}>·</span>
            <span style={{ fontSize: 44, fontWeight: 900, color: FIKAPE_SOFT.ka }}>ka</span>
            <span style={{ fontSize: 44, fontWeight: 300, color: "#333", margin: "0 4px" }}>·</span>
            <span style={{ fontSize: 44, fontWeight: 900, color: FIKAPE_SOFT.pe }}>pe</span>
          </div>
        </div>

        {/* Avatar + rozet */}
        <div style={{ display: "flex", marginTop: 70 }}>
          <div style={{ display: "flex", position: "relative", width: 230, height: 230 }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                width={230}
                height={230}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: 230,
                  height: 230,
                  borderRadius: "50%",
                  background: avatarColor,
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 80,
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                {initials}
              </div>
            )}
            <div
              style={{
                display: "flex",
                position: "absolute",
                bottom: -6,
                right: -6,
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#111",
                border: `6px solid ${EXPERT_BADGE.color}`,
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
              }}
            >
              {EXPERT_BADGE.icon}
            </div>
          </div>
        </div>

        {/* İsim + rozet etiketi */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 40 }}>
          <span
            style={{
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: "1px",
              color: EXPERT_BADGE.color,
              background: EXPERT_BADGE.bg,
              padding: "8px 18px",
              borderRadius: 999,
            }}
          >
            USTA
          </span>
          {location && <span style={{ fontSize: 30, color: "#666" }}>{location}</span>}
        </div>

        {/* Başlık */}
        <div
          style={{
            display: "flex",
            fontSize: 62,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.2,
            letterSpacing: "-1px",
            marginTop: 22,
          }}
        >
          {headline}
        </div>

        {/* Uzmanlık etiketleri */}
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 40 }}>
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#ccc",
                  background: "#1e1e1e",
                  padding: "10px 22px",
                  borderRadius: 999,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        )}

        {/* İsim + istatistikler */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 56 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: "#fff" }}>{displayName}</span>
          <span style={{ fontSize: 26, color: "#666" }}>
            {profile._count.notes} usta görüşü · {memberSince}&apos;den beri kayıtlı
          </span>
        </div>

        {/* Not kesiti — kartın "sığ" durmasının asıl sebebi buydu (bkz.
            kullanıcı geri bildirimi): sadece profil bilgisi, gerçek bir
            içerik yoktu. En son yayınlanan usta notundan kısa bir alıntı +
            "Devamını oku" çağrısı, merak uyandırıp fikape'ye çekiyor. */}
        {noteExcerpt && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 64,
              borderLeft: `5px solid ${EXPERT_BADGE.color}`,
              paddingLeft: 30,
              gap: 14,
            }}
          >
            <span style={{ fontSize: 24, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "1.5px" }}>
              Bir usta notundan
            </span>
            <span style={{ fontSize: 34, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>
              {latestNote!.title}
            </span>
            <span style={{ fontSize: 28, color: "#bbb", lineHeight: 1.5 }}>
              {noteExcerpt}
            </span>
            <span style={{ fontSize: 26, fontWeight: 700, color: FIKAPE_SOFT.fi, marginTop: 6 }}>
              Devamını fikape&apos;de oku →
            </span>
          </div>
        )}

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Alt satır: slogan solda, QR sağ altta */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: FIKAPE_SOFT.fi }} />
            <span style={{ fontSize: 24, color: "#444" }}>Usta Görüşleri — fikape.com</span>
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
