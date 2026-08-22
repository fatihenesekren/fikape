"use client";

import { SPEC_FIELDS, SPEC_GROUPS, getCrossFieldWarnings, type FieldDef } from "@/lib/specFields";

type FieldConfidence = {
  confidence: "high" | "medium" | "low";
  source: string;
  conflictWith?: { source: string; value: string };
};

const BADGE_STYLE: Record<FieldConfidence["confidence"], string> = {
  high:   "bg-green-500",
  medium: "bg-amber-400",
  low:    "bg-red-500",
};
const BADGE_LABEL: Record<FieldConfidence["confidence"], string> = {
  high: "Yüksek güven", medium: "Orta güven", low: "Düşük güven / kontrol et",
};

function BooleanChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options: { value: string; label: string }[] = [
    { value: "", label: "—" },
    { value: "true", label: "Var" },
    { value: "false", label: "Yok" },
  ];
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            value === o.value
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FieldInput({
  f,
  attrs,
  onChange,
  confidence,
}: {
  f: FieldDef;
  attrs: Record<string, string>;
  onChange: (key: string, value: string) => void;
  confidence?: Record<string, FieldConfidence>;
}) {
  const fc = confidence?.[f.key];
  const inputCls = "w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-gray-400 bg-white";

  return (
    <div>
      <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 mb-0.5">
        {fc && (
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${BADGE_STYLE[fc.confidence]}`}
            title={
              fc.conflictWith
                ? `${BADGE_LABEL[fc.confidence]} — çelişki: ${fc.source}=${attrs[f.key]} / ${fc.conflictWith.source}=${fc.conflictWith.value}`
                : `${BADGE_LABEL[fc.confidence]} (${fc.source})`
            }
          />
        )}
        {f.label}{f.type === "number" && "unit" in f && f.unit ? <span className="font-normal ml-1 text-gray-400">({f.unit})</span> : ""}
      </label>

      {f.type === "select" && (
        <select
          value={attrs[f.key] ?? ""}
          onChange={(e) => onChange(f.key, e.target.value)}
          className={inputCls}
        >
          <option value="">—</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {f.type === "boolean" && (
        <BooleanChips value={attrs[f.key] ?? ""} onChange={(v) => onChange(f.key, v)} />
      )}

      {(f.type === "number" || f.type === "text") && (
        <input
          type={f.type === "number" ? "number" : "text"}
          min={0}
          step="any"
          value={attrs[f.key] ?? ""}
          placeholder={"placeholder" in f ? f.placeholder : ""}
          onChange={(e) => onChange(f.key, e.target.value)}
          className={inputCls}
        />
      )}
    </div>
  );
}

export function SpecForm({
  categorySlug,
  attrs,
  onChange,
  confidence,
}: {
  categorySlug: string;
  attrs: Record<string, string>;
  onChange: (key: string, value: string) => void;
  confidence?: Record<string, FieldConfidence>;
}) {
  // showIf'i geçemeyen alanlar (ör. elektrikli olmayan bir motosiklette
  // "Çıkarılabilir Batarya") formda hiç gösterilmiyor — hem admin'in yanlışlıkla
  // anlamsız bir değer girmesini engelliyor hem de "boş bırakılanlar
  // kaydedilmez" ile tutarlı (görünmeyen alan zaten girilemez).
  const fields = (SPEC_FIELDS[categorySlug] ?? []).filter((f) => !f.showIf || f.showIf(attrs));
  if (fields.length === 0) return null;

  const groups = SPEC_GROUPS[categorySlug];
  const warnings = getCrossFieldWarnings(categorySlug, attrs);

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-700 mb-2">
        Teknik Özellikler <span className="text-gray-400 font-normal">(opsiyonel — boş bırakılanlar kaydedilmez)</span>
      </p>

      {warnings.length > 0 && (
        <div className="mb-2 px-2.5 py-2 rounded-lg bg-amber-50 border border-amber-100">
          {warnings.map((w) => (
            <p key={w} className="text-[11px] text-amber-700">⚠ {w}</p>
          ))}
        </div>
      )}

      {groups ? (
        <div className="space-y-2">
          {groups.map((g) => {
            const groupFields = fields.filter((f) => g.keys.includes(f.key));
            if (groupFields.length === 0) return null;
            const filledCount = groupFields.filter((f) => attrs[f.key] != null && attrs[f.key] !== "").length;
            const hasValue = filledCount > 0;
            return (
              <details key={g.title} open={g.defaultOpen || hasValue} className="border border-gray-200 rounded-xl overflow-hidden">
                <summary className="cursor-pointer select-none px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>{g.title}</span>
                  <span className="text-gray-400 font-normal">{filledCount}/{groupFields.length} dolu</span>
                </summary>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3">
                  {groupFields.map((f) => (
                    <FieldInput key={f.key} f={f} attrs={attrs} onChange={onChange} confidence={confidence} />
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {fields.map((f) => (
            <FieldInput key={f.key} f={f} attrs={attrs} onChange={onChange} confidence={confidence} />
          ))}
        </div>
      )}
    </div>
  );
}
