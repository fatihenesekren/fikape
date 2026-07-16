"use client";

import { OWNERSHIP_SLOTS, RECOMMEND_OPTS, USAGE_OPTS, EBIKE_USAGE_OPTS } from "@/lib/reviewFormOptions";
import { ChipGroup, IconChipGroup, SubQuestion } from "./FormPrimitives";

const OWNERSHIP_CHIP_OPTS = OWNERSHIP_SLOTS.map((s) => ({ value: s.key, label: s.label }));

export function OwnershipUsageSection({
  isEbisiklet,
  ownershipSlot, onOwnershipSlotChange,
  usageType, onUsageTypeChange,
  wouldRecommend, onWouldRecommendChange,
}: {
  isEbisiklet: boolean;
  ownershipSlot: string;
  onOwnershipSlotChange: (v: string) => void;
  usageType: string;
  onUsageTypeChange: (v: string) => void;
  wouldRecommend: "yes" | "maybe" | "no" | null;
  onWouldRecommendChange: (v: "yes" | "maybe" | "no") => void;
}) {
  return (
    <>
      <SubQuestion label="Ne kadar süredir kullanıyorsunuz?">
        <ChipGroup opts={OWNERSHIP_CHIP_OPTS} value={ownershipSlot} onChange={onOwnershipSlotChange} />
      </SubQuestion>

      <SubQuestion label="Çoğunlukla nerede kullanıyorsunuz?">
        {isEbisiklet
          ? <IconChipGroup opts={EBIKE_USAGE_OPTS} value={usageType} onChange={onUsageTypeChange} />
          : <IconChipGroup opts={USAGE_OPTS} value={usageType} onChange={onUsageTypeChange} />
        }
      </SubQuestion>

      <SubQuestion label="Bu aracı bir arkadaşınıza tavsiye eder misiniz?">
        <IconChipGroup opts={RECOMMEND_OPTS} value={wouldRecommend} onChange={onWouldRecommendChange} />
      </SubQuestion>
    </>
  );
}
