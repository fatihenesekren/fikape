"use client";

import { useState } from "react";
import { CarDamageDiagram } from "@/components/CarDamageDiagram";
import { CAR_PARTS, PART_CONDITION_LABEL, type PartCondition } from "@/lib/carParts";

const CONDITIONS: PartCondition[] = ["ORIGINAL", "LOCAL_PAINT", "PAINTED", "REPLACED"];

export function PartConditionForm({
  value,
  onChange,
}: {
  value: Record<string, PartCondition | undefined>;
  onChange: (v: Record<string, PartCondition | undefined>) => void;
}) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  function setCondition(partKey: string, condition: PartCondition) {
    onChange({ ...value, [partKey]: condition });
  }

  // Yanlışlıkla işaretlenen bir parçayı geri alma yolu yoktu (bkz. kullanıcı
  // geri bildirimi) — anahtarı nesneden tamamen çıkararak "Belirtilmemiş"
  // durumuna dönülüyor.
  function clearCondition(partKey: string) {
    const next = { ...value };
    delete next[partKey];
    onChange(next);
  }

  const selectedPartLabel = CAR_PARTS.find((p) => p.key === selectedPart)?.label;

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-indigo-800">
        Şema üzerinde bir parçaya tıklayıp durumunu seçin. Tamamı opsiyonel.
      </p>

      <CarDamageDiagram conditions={value} interactivePartKey={selectedPart} onPartClick={setSelectedPart} />

      {selectedPart && (
        <div className="bg-white border border-indigo-200 rounded-lg p-2.5">
          <p className="text-xs font-semibold text-indigo-800 mb-1.5">{selectedPartLabel}</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => clearCondition(selectedPart)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold border-2 border-dashed transition-all"
              style={
                !value[selectedPart]
                  ? { background: "#e5e7eb", borderColor: "#9ca3af", color: "#374151" }
                  : { background: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }
              }
            >
              Belirtilmemiş
            </button>
            {CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(selectedPart, c)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-all"
                style={
                  value[selectedPart] === c
                    ? { background: "#4338ca", borderColor: "#4338ca", color: "#fff" }
                    : { background: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }
                }
              >
                {PART_CONDITION_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {Object.keys(value).length > 0 && (
        <div className="text-[11px] text-indigo-700">
          {Object.entries(value).filter(([, c]) => c).length} parça işaretlendi.
        </div>
      )}
    </div>
  );
}
