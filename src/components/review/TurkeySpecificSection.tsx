"use client";

import type { TurkeySpecificValues } from "@/lib/reviewFormOptions";
import {
  ROAD_OPTS, FUEL_CONSUMPTION_OPTS, LPG_OPTS, EV_RANGE_OPTS, CHARGING_ACCESS_OPTS, WINTER_RANGE_OPTS,
  EBIKE_MOTOR_OPTS, EBIKE_PEDELEC_OPTS, EBIKE_WINTER_OPTS,
} from "@/lib/reviewFormOptions";
import { ChipGroup, YesNo, SubQuestion } from "./FormPrimitives";

export function TurkeySpecificSection({
  isCombustion, isGasoline, isEV, isEscooter, isEbisiklet, values, onChange,
}: {
  isCombustion: boolean; isGasoline: boolean; isEV: boolean; isEscooter: boolean; isEbisiklet: boolean;
  values: TurkeySpecificValues;
  onChange: <K extends keyof TurkeySpecificValues>(key: K, value: TurkeySpecificValues[K]) => void;
}) {
  return (
    <>
      <SubQuestion label="Türkiye yol koşullarına dayanıklılık?" hint="bozuk asfalt, kasis, çukur">
        <ChipGroup opts={ROAD_OPTS} value={values.roadDurability} onChange={(v) => onChange("roadDurability", v)} />
      </SubQuestion>

      {isCombustion && (
        <>
          <SubQuestion label="Gerçek yakıt tüketimi katalogla örtüşüyor mu?">
            <ChipGroup opts={FUEL_CONSUMPTION_OPTS} value={values.fuelConsumption} onChange={(v) => onChange("fuelConsumption", v)} />
          </SubQuestion>

          {isGasoline && (
            <SubQuestion label="LPG durumu">
              <ChipGroup opts={LPG_OPTS} value={values.lpgStatus} onChange={(v) => onChange("lpgStatus", v)} />
            </SubQuestion>
          )}
        </>
      )}

      {isEbisiklet && (
        <>
          <SubQuestion label="Motor tipi">
            <ChipGroup opts={EBIKE_MOTOR_OPTS} value={values.ebikeMotorType} onChange={(v) => onChange("ebikeMotorType", v)} />
          </SubQuestion>

          <SubQuestion label="Pedelec sınıfı">
            <ChipGroup opts={EBIKE_PEDELEC_OPTS} value={values.ebikePedelecClass} onChange={(v) => onChange("ebikePedelecClass", v)} />
          </SubQuestion>

          <SubQuestion label="Gerçek menzil (km)" hint="opsiyonel">
            <input
              type="number"
              min={0}
              value={values.ebikeRealRangeKm}
              onChange={(e) => onChange("ebikeRealRangeKm", e.target.value)}
              placeholder="örn. 45"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            />
          </SubQuestion>

          <SubQuestion label="Kışın menzil kaybı">
            <ChipGroup opts={EBIKE_WINTER_OPTS} value={values.ebikeWinterRange} onChange={(v) => onChange("ebikeWinterRange", v)} />
          </SubQuestion>

          <SubQuestion label="Tam şarj süresi (saat)" hint="opsiyonel">
            <input
              type="number"
              min={0}
              step={0.5}
              value={values.ebikeChargeHours}
              onChange={(e) => onChange("ebikeChargeHours", e.target.value)}
              placeholder="örn. 4"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            />
          </SubQuestion>
        </>
      )}

      {isEV && (
        <>
          <SubQuestion label="Gerçek menzil katalogla örtüşüyor mu?">
            <ChipGroup opts={EV_RANGE_OPTS} value={values.evRange} onChange={(v) => onChange("evRange", v)} />
          </SubQuestion>

          <SubQuestion label="Ev şarjı yapabiliyor musunuz?">
            <YesNo value={values.homeCharging} onChange={(v) => onChange("homeCharging", v)} />
          </SubQuestion>

          {!isEscooter && (
            <SubQuestion label="Bölgenizde şarj istasyonu bulmak kolay mı?">
              <ChipGroup opts={CHARGING_ACCESS_OPTS} value={values.chargingAccess} onChange={(v) => onChange("chargingAccess", v)} />
            </SubQuestion>
          )}

          <SubQuestion label="Kışın menzil kaybı yaşıyor musunuz?">
            <ChipGroup opts={WINTER_RANGE_OPTS} value={values.winterRange} onChange={(v) => onChange("winterRange", v)} />
          </SubQuestion>
        </>
      )}
    </>
  );
}
