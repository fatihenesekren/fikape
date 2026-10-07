// Yerli üretim bayrak ikonu: VehicleCard (sunucu tarafı, sharp kullanan görsel bileşenini içerir) içinde durunca
// istemci bileşenleri (HeroSlider) onu içe aktarırken sharp istemci paketine girip derlemeyi kırıyordu — ayrı dosya.
export function TrFlagIcon() {
  return (
    <svg
      viewBox="0 0 30 20"
      width="14"
      height="9.5"
      role="img"
      aria-label="Yerli üretim"
    >
      <rect width="30" height="20" fill="#E30A17" />
      <circle cx="12" cy="10" r="5.5" fill="#fff" />
      <circle cx="13.5" cy="10" r="4.4" fill="#E30A17" />
      <polygon
        fill="#fff"
        points="18.5,10 20.9,10.75 19.45,8.73 19.45,11.27 20.9,9.25"
      />
    </svg>
  );
}
