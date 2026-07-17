"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/Avatar";
import { buildAvatarOptions, dicebearUrl } from "@/lib/avatar";

// DiceBear ücretsiz API bazen tekil isteklerde geçici hata dönebiliyor
// (SLA'sız üçüncü parti servis, muhtemelen seçici açılınca ~16-20 görselin
// aynı anda istenmesiyle rate-limit'e takılıyor) — art arda 3 deneme yapılır,
// her denemeden önce artan bir gecikme bırakılır (rate-limit penceresinin
// geçmesi için), yine başarısız olursa çirkin "kırık görsel" yerine nötr
// bir placeholder gösterilir.
const MAX_AVATAR_RETRIES = 3;

function AvatarOptionImg({ src }: { src: string }) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-lg">
        ?
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- DiceBear'dan üretilen SVG
    <img
      src={attempt > 0 ? `${src}&retry=${attempt}` : src}
      alt="Avatar seçeneği"
      width={64}
      height={64}
      className="w-full rounded-lg"
      loading="lazy"
      onError={() => {
        if (attempt < MAX_AVATAR_RETRIES) {
          setTimeout(() => setAttempt((a) => a + 1), 400 * (attempt + 1));
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

export function AvatarPicker({
  userId,
  displayName,
  initialAvatarUrl,
}: {
  userId: number;
  displayName: string | null;
  initialAvatarUrl: string | null;
}) {
  const { update } = useSession();
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const options = buildAvatarOptions(userId);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function choose(index: number | null) {
    setLoading(true);
    const res = await fetch("/api/profile/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    if (res.ok) {
      const data = await res.json();
      setAvatarUrl(data.avatarUrl);
      await update({ image: data.avatarUrl });
      setOpen(false);
    }
    setLoading(false);
  }

  return (
    <div ref={rootRef} className="relative flex items-center gap-3">
      <Avatar displayName={displayName} avatarUrl={avatarUrl} seed={String(userId)} size={56} />
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold text-gray-500 hover:text-gray-800 hover:underline"
      >
        Avatarını değiştir
      </button>

      {open && (
        <div className="absolute mt-2 top-full left-0 z-20 bg-white border border-gray-100 rounded-2xl shadow-lg p-4 w-80">
          <p className="text-xs font-semibold text-gray-500 mb-3">Bir avatar seç</p>
          <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
            {options.map((opt) => (
              <button
                key={opt.index}
                onClick={() => choose(opt.index)}
                disabled={loading}
                className="rounded-xl border border-gray-100 hover:border-gray-300 p-1.5 transition-colors disabled:opacity-50"
              >
                <AvatarOptionImg src={dicebearUrl(opt.seed, opt.style)} />
              </button>
            ))}
          </div>
          <button
            onClick={() => choose(null)}
            disabled={loading}
            className="mt-3 w-full text-xs font-semibold text-gray-500 hover:text-gray-800 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Baş harflerimi kullan
          </button>
        </div>
      )}
    </div>
  );
}
