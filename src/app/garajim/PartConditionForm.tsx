"use client";

import { useState } from "react";
import { CarDamageDiagram } from "@/components/CarDamageDiagram";
import { CAR_PARTS, PART_CONDITION_LABEL, PART_CONDITION_COLOR, type PartCondition } from "@/lib/carParts";

const CONDITIONS: PartCondition[] = ["ORIGINAL", "LOCAL_PAINT", "PAINTED", "REPLACED"];

// Çoğu ilanda ya araç tamamen orijinal ya da (nadiren) tamamı boyalı/değişen
// oluyor — 13 parçayı tek tek işaretlemek yerine tek tıkla tümünü doldurmak
// kullanıcı kolaylığı (bkz. kullanıcı talebi). Lokal Boyalı bilerek yok —
// "tümü lokal boyalı" gerçek hayatta anlamlı bir senaryo değil.
const BULK_CONDITIONS: PartCondition[] = ["ORIGINAL", "PAINTED", "REPLACED"];

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
  const markedCount = Object.values(value).filter(Boolean).length;

  // Mevcut işaretlemelerin üzerine yazacağı için (var olan tekil seçimler
  // kaybolur) sadece boş değilken onay isteniyor — boş formda tıklamak
  // sürtünmesiz olmalı.
  function applyToAll(condition: PartCondition) {
    if (markedCount > 0 && !window.confirm("Mevcut işaretlemeler bu seçimle değiştirilecek. Emin misiniz?")) return;
    onChange(Object.fromEntries(CAR_PARTS.map((p) => [p.key, condition])));
  }

  function clearAll() {
    if (!window.confirm("Tüm işaretlemeler kaldırılacak. Emin misiniz?")) return;
    onChange({});
  }

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-indigo-800">
        Aracın tamamı orijinal veya tamamı boyalı/değişense aşağıdan tek tıkla
        işaretleyebilir, ardından tek tek düzeltebilirsiniz. Tamamı opsiyonel.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {BULK_CONDITIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => applyToAll(c)}
            className="px-2.5 py-1 rounded-full text-xs font-semibold border-2 bg-white transition-colors hover:opacity-80"
            style={{ borderColor: PART_CONDITION_COLOR[c], color: PART_CONDITION_COLOR[c] }}
          >
            Tümü {PART_CONDITION_LABEL[c]}
          </button>
        ))}
        {markedCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="px-2.5 py-1 rounded-full text-xs font-semibold border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 transition-colors"
          >
            Tümünü Temizle
          </button>
        )}
      </div>

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

      {markedCount > 0 && (
        <div className="text-[11px] text-indigo-700">
          {markedCount} parça işaretlendi.
        </div>
      )}
    </div>
  );
}
