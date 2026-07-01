"use client";

import { useState } from "react";

interface MonthlyScore {
  month: string;   // "2025-03"
  avg: number;
  count: number;
}

const TR_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function formatMonth(month: string) {
  const [y, m] = month.split("-");
  return `${TR_MONTHS[parseInt(m) - 1]} ${y?.slice(2)}`;
}

export function ScoreTrendChart({ points }: { points: MonthlyScore[] }) {
  const [hover, setHover] = useState<number | null>(null);

  if (points.length < 2) return null;

  const W = 560;
  const H = 140;
  const PAD = { top: 20, right: 20, bottom: 32, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const scores = points.map((p) => p.avg);
  const rawMin = Math.min(...scores);
  const rawMax = Math.max(...scores);
  // If all scores equal, give ±1 range so the line is centered
  const yMin = rawMin === rawMax ? Math.max(0, rawMin - 1) : Math.max(0, rawMin - 0.5);
  const yMax = rawMin === rawMax ? Math.min(10, rawMax + 1) : Math.min(10, rawMax + 0.5);

  const xStep = chartW / Math.max(points.length - 1, 1);

  function px(i: number) {
    return PAD.left + i * xStep;
  }
  function py(score: number) {
    return PAD.top + chartH - ((score - yMin) / (yMax - yMin)) * chartH;
  }

  const polyline = points.map((p, i) => `${px(i)},${py(p.avg)}`).join(" ");

  // Y axis ticks — 3 evenly spaced
  const yTicks = [yMin, (yMin + yMax) / 2, yMax].map((v) => Math.round(v * 10) / 10);

  // Trend direction
  const first = points[0].avg;
  const last  = points[points.length - 1].avg;
  const delta = Math.round((last - first) * 10) / 10;
  const deltaColor = delta > 0 ? "#16a34a" : delta < 0 ? "#dc2626" : "#6b7280";
  const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <div className="px-5 py-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          Skor Trendi
          <span className="font-normal normal-case ml-1.5 text-gray-400">
            ({points.reduce((s, p) => s + p.count, 0)} yorum/güncelleme)
          </span>
        </p>
        {delta !== 0 && (
          <span className="text-xs font-bold" style={{ color: deltaColor }}>
            {deltaLabel} puan
          </span>
        )}
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Skor trendi grafiği"
        >
          {/* Y grid lines */}
          {yTicks.map((t) => (
            <line
              key={t}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={py(t)}
              y2={py(t)}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}

          {/* Y axis labels */}
          {yTicks.map((t) => (
            <text
              key={`yl-${t}`}
              x={PAD.left - 6}
              y={py(t) + 4}
              textAnchor="end"
              fontSize="10"
              fill="#9ca3af"
            >
              {t.toFixed(1)}
            </text>
          ))}

          {/* Area fill */}
          <polygon
            points={[
              ...points.map((p, i) => `${px(i)},${py(p.avg)}`),
              `${px(points.length - 1)},${PAD.top + chartH}`,
              `${px(0)},${PAD.top + chartH}`,
            ].join(" ")}
            fill="#111"
            fillOpacity="0.04"
          />

          {/* Polyline */}
          <polyline
            points={polyline}
            fill="none"
            stroke="#111"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* X axis labels */}
          {points.map((p, i) => {
            // Show label every N points to avoid crowding
            const step = points.length > 8 ? Math.ceil(points.length / 6) : 1;
            if (i % step !== 0 && i !== points.length - 1) return null;
            return (
              <text
                key={`xl-${i}`}
                x={px(i)}
                y={H - 6}
                textAnchor="middle"
                fontSize="10"
                fill="#9ca3af"
              >
                {formatMonth(p.month)}
              </text>
            );
          })}

          {/* Dots + hover targets */}
          {points.map((p, i) => (
            <g key={i}>
              {/* Invisible hit area */}
              <circle
                cx={px(i)}
                cy={py(p.avg)}
                r="12"
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className="cursor-default"
              />
              {/* Visible dot */}
              <circle
                cx={px(i)}
                cy={py(p.avg)}
                r={hover === i ? 4.5 : 3}
                fill={hover === i ? "#111" : "#fff"}
                stroke="#111"
                strokeWidth="1.5"
                style={{ transition: "r 0.1s" }}
                pointerEvents="none"
              />
            </g>
          ))}

          {/* Tooltip */}
          {hover !== null && (() => {
            const p = points[hover];
            const x = px(hover);
            const y = py(p.avg);
            const tipW = 72;
            const tipH = 32;
            const tipX = Math.min(Math.max(x - tipW / 2, PAD.left), W - PAD.right - tipW);
            const tipY = y - tipH - 8;
            return (
              <g pointerEvents="none">
                <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="6" fill="#111" />
                <text x={tipX + tipW / 2} y={tipY + 13} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
                  {p.avg.toFixed(1)}/10
                </text>
                <text x={tipX + tipW / 2} y={tipY + 26} textAnchor="middle" fontSize="9" fill="#9ca3af">
                  {p.count} olay · {formatMonth(p.month)}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
