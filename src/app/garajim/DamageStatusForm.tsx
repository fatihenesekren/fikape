"use client";

import {
  DAMAGE_STATUS_LABEL, DAMAGE_STATUS_COLOR, type DamageStatus,
  MECHANICAL_CONDITIONS, MECHANICAL_CONDITION_LABEL, MECHANICAL_CONDITION_COLOR, type MechanicalCondition,
  MECHANICAL_COMPONENTS, type TramerRecordInput, formatTl,
} from "@/lib/damageStatus";

const DAMAGE_STATUSES: DamageStatus[] = ["NONE", "DAMAGED", "HEAVY"];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i);

export interface DamageStatusValue {
  damageStatus: DamageStatus | null;
  engineCondition: MechanicalCondition | null;
  engineNote: string;
  transmissionCondition: MechanicalCondition | null;
  transmissionNote: string;
  runningGearCondition: MechanicalCondition | null;
  runningGearNote: string;
  tramerRecords: TramerRecordInput[];
}

export const EMPTY_DAMAGE_STATUS: DamageStatusValue = {
  damageStatus: null,
  engineCondition: null,
  engineNote: "",
  transmissionCondition: null,
  transmissionNote: "",
  runningGearCondition: null,
  runningGearNote: "",
  tramerRecords: [],
};

const CONDITION_KEY: Record<string, { condition: keyof DamageStatusValue; note: keyof DamageStatusValue }> = {
  engine: { condition: "engineCondition", note: "engineNote" },
  transmission: { condition: "transmissionCondition", note: "transmissionNote" },
  runningGear: { condition: "runningGearCondition", note: "runningGearNote" },
};

export function DamageStatusForm({
  value,
  onChange,
}: {
  value: DamageStatusValue;
  onChange: (v: DamageStatusValue) => void;
}) {
  function patch(next: Partial<DamageStatusValue>) {
    onChange({ ...value, ...next });
  }

  function setComponentCondition(componentKey: string, condition: MechanicalCondition) {
    const { condition: conditionKey } = CONDITION_KEY[componentKey];
    patch({ [conditionKey]: condition } as Partial<DamageStatusValue>);
  }

  function clearComponentCondition(componentKey: string) {
    const { condition: conditionKey } = CONDITION_KEY[componentKey];
    patch({ [conditionKey]: null } as Partial<DamageStatusValue>);
  }

  function setComponentNote(componentKey: string, note: string) {
    const { note: noteKey } = CONDITION_KEY[componentKey];
    patch({ [noteKey]: note } as Partial<DamageStatusValue>);
  }

  function addTramerRecord() {
    patch({
      tramerRecords: [...value.tramerRecords, { month: 1, year: CURRENT_YEAR, amount: 0 }],
    });
  }

  function updateTramerRecord(index: number, patchRecord: Partial<TramerRecordInput>) {
    patch({
      tramerRecords: value.tramerRecords.map((r, i) => (i === index ? { ...r, ...patchRecord } : r)),
    });
  }

  function removeTramerRecord(index: number) {
    patch({ tramerRecords: value.tramerRecords.filter((_, i) => i !== index) });
  }

  const tramerTotal = value.tramerRecords.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-indigo-700 bg-indigo-100/60 rounded-lg px-2.5 py-2">
        Buradaki bilgiler ilan sahibi tarafından beyan edilir, fikape tarafından doğrulanmaz.
      </p>

      {/* Genel hasar durumu */}
      <div>
        <p className="text-xs font-semibold text-indigo-800 mb-1.5">Genel Hasar Durumu</p>
        <div className="flex flex-wrap gap-1.5">
          {DAMAGE_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => patch({ damageStatus: value.damageStatus === s ? null : s })}
              className="px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-colors"
              style={
                value.damageStatus === s
                  ? { background: DAMAGE_STATUS_COLOR[s], borderColor: DAMAGE_STATUS_COLOR[s], color: "#fff" }
                  : { background: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }
              }
            >
              {DAMAGE_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Motor / Şanzıman / Yürüyen Aksam */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-indigo-800">Motor / Şanzıman / Yürüyen Aksam</p>
        {MECHANICAL_COMPONENTS.map((c) => {
          const { condition: conditionKey, note: noteKey } = CONDITION_KEY[c.key];
          const condition = value[conditionKey] as MechanicalCondition | null;
          const note = value[noteKey] as string;
          return (
            <div key={c.key} className="bg-white border border-indigo-100 rounded-lg p-2.5 space-y-1.5">
              <p className="text-xs font-semibold text-gray-700">{c.label}</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => clearComponentCondition(c.key)}
                  className="px-2 py-1 rounded-full text-[11px] font-semibold border-2 border-dashed transition-all"
                  style={
                    !condition
                      ? { background: "#e5e7eb", borderColor: "#9ca3af", color: "#374151" }
                      : { background: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }
                  }
                >
                  Belirtilmemiş
                </button>
                {MECHANICAL_CONDITIONS.map((mc) => (
                  <button
                    key={mc}
                    type="button"
                    onClick={() => setComponentCondition(c.key, mc)}
                    className="px-2 py-1 rounded-full text-[11px] font-semibold border-2 transition-all"
                    style={
                      condition === mc
                        ? { background: MECHANICAL_CONDITION_COLOR[mc], borderColor: MECHANICAL_CONDITION_COLOR[mc], color: "#fff" }
                        : { background: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }
                    }
                  >
                    {MECHANICAL_CONDITION_LABEL[mc]}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={note}
                onChange={(e) => setComponentNote(c.key, e.target.value)}
                maxLength={300}
                placeholder="Opsiyonel not (örn. turbo değişti, 15.000 km'de)"
                className="w-full text-xs rounded-lg border border-gray-200 px-2 py-1.5"
              />
            </div>
          );
        })}
      </div>

      {/* Tramer kayıtları */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-indigo-800">Tramer Kayıtları</p>
          {tramerTotal > 0 && (
            <span className="text-[11px] font-semibold text-indigo-700">Toplam: {formatTl(tramerTotal)}</span>
          )}
        </div>
        <div className="space-y-1.5">
          {value.tramerRecords.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <select
                value={r.month}
                onChange={(e) => updateTramerRecord(i, { month: Number(e.target.value) })}
                aria-label="Ay"
                className="text-xs rounded-lg border border-gray-200 px-1.5 py-1.5 bg-white"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={r.year}
                onChange={(e) => updateTramerRecord(i, { year: Number(e.target.value) })}
                aria-label="Yıl"
                className="text-xs rounded-lg border border-gray-200 px-1.5 py-1.5 bg-white"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step="any"
                value={r.amount || ""}
                onChange={(e) => updateTramerRecord(i, { amount: Number(e.target.value) || 0 })}
                placeholder="Tutar (TL)"
                aria-label="Tutar"
                className="min-w-0 flex-1 text-xs rounded-lg border border-gray-200 px-2 py-1.5"
              />
              <button
                type="button"
                onClick={() => removeTramerRecord(i)}
                aria-label="Kaydı sil"
                className="shrink-0 text-gray-400 hover:text-red-600 text-xs px-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTramerRecord}
          className="mt-1.5 text-[11px] font-semibold text-indigo-600 hover:underline"
        >
          + Tramer Kaydı Ekle
        </button>
      </div>
    </div>
  );
}
