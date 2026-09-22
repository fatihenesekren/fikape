"use client";

import { useState } from "react";

export function UstaShareCard({
  slug,
  headline,
}: {
  slug: string;
  headline: string;
}) {
  const [sharing, setSharing] = useState(false);
  const imageUrl = `/usta/${slug}/kart.png`;
  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/usta/${slug}`
      : `/usta/${slug}`;
  const shareText = `${headline} — fikape'de usta profilini incele 👇`;
  const downloadFileName = `fikape-usta-${slug}-karti.png`;

  async function handleShare() {
    setSharing(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], downloadFileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "fikape",
          text: shareText,
        });
        return;
      }
    } catch {
      // kullanıcı paylaşımı iptal etti veya Web Share API desteklenmiyor — WhatsApp'a düş
    } finally {
      setSharing(false);
    }

    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${profileUrl}`)}`;
    window.open(waUrl, "_blank");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden border border-gray-100 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={`${headline} usta kartı`} className="w-full h-auto" />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: "#111" }}
        >
          {sharing ? "Hazırlanıyor..." : "Paylaş"}
        </button>
        <a
          href={imageUrl}
          download={downloadFileName}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors"
        >
          İndir
        </a>
      </div>
    </div>
  );
}
