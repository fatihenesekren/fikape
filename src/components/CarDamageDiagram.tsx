import { CAR_PARTS, PART_CONDITION_COLOR, PART_CONDITION_LABEL, type PartCondition } from "@/lib/carParts";

// Kuşbakışı araç şeması — kullanıcının paylaştığı referans görselin birebir
// kopyası DEĞİL, fikape'nin kendi çizimi: daralan burun/kuyruk, çamurluk
// kabartması ve pah kırılmış tavan köşeleriyle gerçekçi bir siluete
// yaklaştırılmış 13 parça (bkz. carParts.ts — path koordinatları orada).
// İlk taslak; kullanıcı geri bildirimiyle ince ayar yapılabilir. Salt-okunur
// kullanımda bir editör değil, formda (PartConditionForm.tsx) girilen
// verinin görselleştirmesi.
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
        {/* Lastikler — sabit dekor, tıklanabilir/renklendirilebilir değil.
            Çamurluk kabartmasının (bkz. carParts.ts) tam hizasına oturacak
            şekilde konumlandırıldı. */}
        <rect x="0"   y="68"  width="10" height="48" rx="4" fill="#4B5563" />
        <rect x="190" y="68"  width="10" height="48" rx="4" fill="#4B5563" />
        <rect x="0"   y="324" width="10" height="48" rx="4" fill="#4B5563" />
        <rect x="190" y="324" width="10" height="48" rx="4" fill="#4B5563" />

        {CAR_PARTS.map((part) => {
          const cond = conditions[part.key];
          const fill = cond ? PART_CONDITION_COLOR[cond] : "#F3F4F6";
          const clickable = !!onPartClick;
          return (
            <path
              key={part.key}
              d={part.d}
              fill={fill}
              stroke={interactivePartKey === part.key ? "#4338ca" : "#fff"}
              strokeWidth={interactivePartKey === part.key ? 3 : 2}
              strokeLinejoin="round"
              onClick={clickable ? () => onPartClick(part.key) : undefined}
              style={clickable ? { cursor: "pointer" } : undefined}
            >
              <title>{part.label}{cond ? ` — ${PART_CONDITION_LABEL[cond]}` : ""}</title>
            </path>
          );
        })}

        {/* Far/stop lambaları — sabit dekor (lastikler gibi tıklanamaz), tek
            işlevi ön/arkayı tek bakışta ayırt ettirmek (bkz. kullanıcı geri
            bildirimi: burun/kuyruk taperı simetrik olduğu için yön belirsizdi).
            Parça path'lerinin ÜZERİNE çiziliyor ki altındaki boya rengi ne
            olursa olsun (ör. ön tampon "Değişen" kırmızısıysa bile) görünür kalsın. */}
        <rect x="23"  y="18"  width="14" height="10" rx="2" fill="#FDE68A" stroke="#fff" strokeWidth={1} />
        <rect x="163" y="18"  width="14" height="10" rx="2" fill="#FDE68A" stroke="#fff" strokeWidth={1} />
        <rect x="16"  y="397" width="14" height="10" rx="2" fill="#DC2626" stroke="#fff" strokeWidth={1} />
        <rect x="170" y="397" width="14" height="10" rx="2" fill="#DC2626" stroke="#fff" strokeWidth={1} />
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
