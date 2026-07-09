"use client";

import { SPEC_FIELDS } from "@/lib/specFields";

export function SpecForm({
  categorySlug,
  attrs,
  onChange,
}: {
  categorySlug: string;
  attrs: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const fields = SPEC_FIELDS[categorySlug] ?? [];
  if (fields.length === 0) return null;

  const inputCls = "w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-gray-400 bg-white";

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-700 mb-2">
        Teknik Özellikler <span className="text-gray-400 font-normal">(opsiyonel — boş bırakılanlar kaydedilmez)</span>
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
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
              <select
                value={attrs[f.key] ?? ""}
                onChange={(e) => onChange(f.key, e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                <option value="true">Var</option>
                <option value="false">Yok</option>
              </select>
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
        ))}
      </div>
    </div>
  );
}
