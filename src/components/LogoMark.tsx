// fikape işareti — çember üzerinde 3 eşit segmentli halka (0–10 skoru/gösterge
// çağrışımı). Üst = Fİ (navy, Fiyat), sol-alt = KA (yeşil, Kalite), sağ-alt =
// PE (kiremit, Performans). Renkler wordmark ile aynı. Sunucu-güvenli (hook yok).
import { FIKAPE_MID, FIKAPE_SOFT } from "@/lib/fikape";

// Açık zeminde marka tonu (MID); koyu zeminde ("onDark") aynı ailenin açık
// tonları (SOFT). Değerler src/lib/fikape.ts'te — tek kaynak.
const PALETTE = { brand: FIKAPE_MID, onDark: FIKAPE_SOFT };

export function LogoMark({
  size = 24,
  className = "",
  variant = "brand",
}: {
  size?: number;
  className?: string;
  variant?: "brand" | "onDark";
}) {
  const c = PALETTE[variant];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      strokeWidth={15}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 23 A40 40 0 0 1 80 23" stroke={c.fi} />
      <path d="M42 89 A40 40 0 0 1 12 38" stroke={c.ka} />
      <path d="M88 38 A40 40 0 0 1 58 89" stroke={c.pe} />
    </svg>
  );
}
