import { FIKAPE, type FikapeScores, calcOverall } from "@/lib/fikape";

interface Props {
  scores: FikapeScores;
  variant?: "chips" | "bars";
  reviewCount?: number;
}

export function FikapeScore({ scores, variant = "chips", reviewCount }: Props) {
  const overall = scores.scoreOverall ?? calcOverall(scores);

  if (variant === "bars") {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-baseline mb-3">
          <span className="text-sm font-semibold text-gray-500">
            {reviewCount != null ? `${reviewCount} yorum` : ""}
          </span>
          <span className="text-2xl font-black">
            {overall.toFixed(1)}<span className="text-sm font-normal text-gray-400">/10</span>
          </span>
        </div>
        {FIKAPE.map(({ key, short, label, color }) => {
          const val = scores[key as keyof FikapeScores] as number;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-6 text-xs font-bold" style={{ color }}>{short}</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(val / 10) * 100}%`, background: color }}
                />
              </div>
              <span className="text-xs font-bold w-6 text-right" style={{ color }}>{val.toFixed(1)}</span>
              <span className="text-xs text-gray-400 w-20">{label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // chips (kart görünümü için)
  return (
    <div className="flex gap-2">
      {FIKAPE.map(({ key, short, label, color, sub, bg }) => {
        const val = scores[key as keyof FikapeScores] as number;
        return (
          <div key={key} className="flex-1 text-center rounded-lg py-2 px-1" style={{ background: bg }}>
            <div className="text-[10px] font-bold" style={{ color }}>{short}</div>
            <div className="text-lg font-black leading-none" style={{ color }}>{val.toFixed(1)}</div>
            <div className="text-[9px] mt-0.5" style={{ color: sub }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}
