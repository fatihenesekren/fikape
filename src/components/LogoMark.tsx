// fikape işareti — çember üzerinde 3 eşit segmentli halka (0–10 skoru/gösterge
// çağrışımı). Üst = Fİ (navy, Fiyat), sol-alt = KA (yeşil, Kalite), sağ-alt =
// PE (kiremit, Performans). Renkler wordmark ile aynı. Sunucu-güvenli (hook yok).
export function LogoMark({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
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
      <path d="M20 23 A40 40 0 0 1 80 23" stroke="#185FA5" />
      <path d="M42 89 A40 40 0 0 1 12 38" stroke="#3B6D11" />
      <path d="M88 38 A40 40 0 0 1 58 89" stroke="#993C1D" />
    </svg>
  );
}
