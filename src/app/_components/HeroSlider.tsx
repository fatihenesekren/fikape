"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FikapeScore } from "@/components/FikapeScore";

type TopProduct = {
  slug: string;
  brandName: string;
  modelName: string;
  imageUrl: string | null;
  year: number | null;
  reviewCount: number;
  scores: {
    scoreFiyat: number;
    scoreKalite: number;
    scorePerformans: number;
    scoreOverall: number;
  };
};

const INTERVAL_MS = 5000;
const TRANSITION = "opacity 420ms ease, transform 420ms ease";

const RANK_BADGES = ["🥇", "🥈", "🥉"];

export function HeroSlider({ products }: { products: TopProduct[] }) {
  const total = products.length + 1; // slide 0 = nasıl çalışır
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (total <= 1 || paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % total), INTERVAL_MS);
    return () => clearInterval(id);
  }, [total, paused]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* grid ile tüm slaytlar aynı hücrede üst üste durur, crossfade+ölçek ile geçiş yapılır */}
      <div
        className="w-72 grid"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Slide 0: Nasıl Çalışır */}
        <div
          className="w-72 rounded-2xl p-6"
          style={{
            gridArea: "1 / 1",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            transition: TRANSITION,
            opacity: active === 0 ? 1 : 0,
            transform: active === 0 ? "scale(1)" : "scale(0.96)",
            pointerEvents: active === 0 ? "auto" : "none",
            zIndex: active === 0 ? 1 : 0,
          }}
        >
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">
            Nasıl Çalışır?
          </p>

          <div className="space-y-3 mb-6">
            {[
              { short: "Fİ", label: "Fiyat",      color: "#85B7EB", width: "72%" },
              { short: "KA", label: "Kalite",     color: "#97C459", width: "85%" },
              { short: "PE", label: "Performans", color: "#F0997B", width: "78%" },
            ].map(({ short, label, color, width }) => (
              <div key={short} className="flex items-center gap-3">
                <span className="text-xs font-black shrink-0 w-5 text-right" style={{ color }}>
                  {short}
                </span>
                <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
                  <div className="h-full rounded-full" style={{ width, background: color, opacity: 0.75 }} />
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-600 text-center leading-relaxed mb-5">
            Her araç için 3 boyutlu puanlama.<br />
            Gerçek kullanıcılardan gerçek veriler.
          </p>

          <div className="text-center">
            <a
              href="/yorum-yaz"
              className="inline-block text-xs font-bold px-4 py-2 rounded-xl border border-white/12 text-gray-400 hover:text-white hover:border-white/25 transition-colors"
            >
              İlk yorumu sen yaz →
            </a>
          </div>
        </div>

        {/* Slides 1-3: Ürün kartları */}
        {products.map((p, idx) => {
          const isActive = active === idx + 1;
          const badge = RANK_BADGES[idx];
          return (
            <div
              key={p.slug}
              className="w-72 bg-white rounded-2xl shadow-2xl p-5 relative"
              style={{
                gridArea: "1 / 1",
                transition: TRANSITION,
                opacity: isActive ? 1 : 0,
                transform: isActive ? "scale(1)" : "scale(0.96)",
                pointerEvents: isActive ? "auto" : "none",
                zIndex: isActive ? 1 : 0,
              }}
            >
              {badge && (
                <div
                  className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm z-10"
                  aria-hidden="true"
                >
                  {badge}
                </div>
              )}

              {p.imageUrl && (
                <div className="relative w-full h-36 rounded-xl overflow-hidden mb-4">
                  <Image
                    src={p.imageUrl}
                    alt={`${p.brandName} ${p.modelName}`}
                    fill
                    sizes="288px"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                {p.brandName}
              </div>
              <div className="text-base font-bold text-gray-900 mb-3">
                {p.modelName}
                {p.year && (
                  <span className="text-gray-400 font-normal ml-1.5">· {p.year}</span>
                )}
              </div>

              <FikapeScore scores={p.scores} variant="chips" />

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">{p.reviewCount} kullanıcı yorumu</span>
                <a
                  href={`/araclar/${p.slug}`}
                  className="text-xs font-semibold text-gray-900 hover:text-gray-500 transition-colors"
                >
                  İncele →
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nokta göstergesi */}
      {total > 1 && (
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className="rounded-full transition-all"
              style={{
                transitionDuration: "400ms",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                width:      i === active ? "20px" : "6px",
                height:     "6px",
                background: i === active ? "white" : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
