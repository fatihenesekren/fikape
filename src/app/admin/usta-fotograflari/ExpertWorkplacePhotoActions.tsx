"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BlurEditor } from "../yorumlar/BlurEditor";

// url: BlurEditor'ün tuvale yükleyeceği kaynak görsel — bulanıklaştırma
// sonrası DB satırı bu route üzerinden güncellenip sayfa router.refresh() ile
// yeniden çekiliyor (onayla/reddet ile aynı desen), o yüzden burada ayrıca
// yerel bir görsel state'i tutmaya gerek yok.
export function ExpertWorkplacePhotoActions({ photoId, url }: { photoId: number; url: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [blurring, setBlurring] = useState(false);

  async function act(action: "approve" | "reject") {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/expert-workplace-photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      {blurring && (
        <BlurEditor
          expertWorkplacePhotoId={photoId}
          url={url}
          onSave={() => {
            setBlurring(false);
            router.refresh();
          }}
          onClose={() => setBlurring(false)}
        />
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setBlurring(true)}
          disabled={loading !== null}
          className="text-xs font-semibold text-gray-500 hover:underline disabled:opacity-60"
        >
          Bulanıklaştır
        </button>
        <button
          onClick={() => act("approve")}
          disabled={loading !== null}
          className="text-xs font-semibold text-green-700 hover:underline disabled:opacity-60"
        >
          {loading === "approve" ? "Onaylanıyor..." : "Onayla"}
        </button>
        <button
          onClick={() => act("reject")}
          disabled={loading !== null}
          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
        >
          {loading === "reject" ? "Reddediliyor..." : "Reddet"}
        </button>
      </div>
    </>
  );
}
