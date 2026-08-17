import { CAR_PARTS, PART_CONDITION_COLOR, PART_CONDITION_LABEL, type PartCondition } from "@/lib/carParts";

// Kuşbakışı, sade/geometrik bir araç şeması — kullanıcının paylaştığı referans
// görselin birebir kopyası DEĞİL, fikape'nin kendi çizimi (dikdörtgen panellere
// bölünmüş, indigo/gri site paleti). Salt-okunur: bir editör değil, formda
// (PartConditionForm.tsx) girilen verinin görselleştirmesi.
export function CarDamageDiagram({
  conditions,
  interactivePartKey,
  onPartClick,
}: {
  conditions: Record<string, PartCondition | undefined>;
  interactivePartKey?: string | null;
  onPartClick?: (partKey: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 200 440" className="w-full max-w-[220px]" role="img" aria-label="Araç boya/hasar şeması, kuşbakışı">
        {/* Lastikler — sabit dekor, tıklanabilir/renklendirilebilir değil */}
        <rect x="12" y="75"  width="10" height="50" rx="4" fill="#4B5563" />
        <rect x="178" y="75" width="10" height="50" rx="4" fill="#4B5563" />
        <rect x="12" y="325" width="10" height="50" rx="4" fill="#4B5563" />
        <rect x="178" y="325" width="10" height="50" rx="4" fill="#4B5563" />

        {CAR_PARTS.map((part) => {
          const cond = conditions[part.key];
          const fill = cond ? PART_CONDITION_COLOR[cond] : "#F3F4F6";
          const clickable = !!onPartClick;
          return (
            <rect
              key={part.key}
              x={part.rect.x}
              y={part.rect.y}
              width={part.rect.width}
              height={part.rect.height}
              rx={part.rx ?? 4}
              fill={fill}
              stroke={interactivePartKey === part.key ? "#4338ca" : "#fff"}
              strokeWidth={interactivePartKey === part.key ? 3 : 2}
              onClick={clickable ? () => onPartClick(part.key) : undefined}
              style={clickable ? { cursor: "pointer" } : undefined}
            >
              <title>{part.label}{cond ? ` — ${PART_CONDITION_LABEL[cond]}` : ""}</title>
            </rect>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-gray-500">
        <LegendDot color="#F3F4F6" label="Belirtilmemiş" bordered />
        {(Object.keys(PART_CONDITION_LABEL) as PartCondition[]).map((c) => (
          <LegendDot key={c} color={PART_CONDITION_COLOR[c]} label={PART_CONDITION_LABEL[c]} />
        ))}
      </div>
    </div>
  );
}

function LegendDot({ color, label, bordered }: { color: string; label: string; bordered?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="w-3 h-3 rounded-sm inline-block"
        style={{ background: color, border: bordered ? "1px solid #D1D5DB" : undefined }}
      />
      {label}
    </span>
  );
}
