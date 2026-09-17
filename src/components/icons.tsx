// Paylaşılan inline SVG ikonlar — outline stil, stroke="currentColor",
// hepsi aynı `size`/`className` API'siyle (3 ajanlı frontend tutarlılık
// denetimi: GearIcon/ClipboardIcon/MessageIcon birden fazla dosyada
// birebir aynı SVG koduyla tekrar tanımlanmıştı — drift riski taşıyordu,
// buraya tek kaynağa çıkarıldı).

interface IconProps {
  size?: number;
  className?: string;
}

export function GearIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

// Usta Profilim — bilinçli olarak header'daki düz kişi silueti (Profilim)
// ikonundan FARKLI: hedef kendi hesabı değil, herkese açık/fotoğraflı bir
// CV/kimlik kartı (/usta/[slug]) — kullanıcı isteği, widget'ta 3 alternatif
// (kimlik kartı/göz/dışa link) paylaşılıp bu onaylandı.
export function IdCardIcon({ size = 18, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8.5" cy="11.5" r="2" />
      <path d="M5.5 16c0-1.7 1.3-3 3-3s3 1.3 3 3" />
      <line x1="14" y1="9" x2="19" y2="9" />
      <line x1="14" y1="13" x2="19" y2="13" />
    </svg>
  );
}

export function ClipboardIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4a1 1 0 0 1 1-2h4a1 1 0 0 1 1 2" />
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="13" y2="15" />
    </svg>
  );
}

// Mesajlarım — header'daki zil-gibi mesaj panelinden (MessageBell.tsx) beri
// kullanılan aynı ikon.
export function MessageIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 15.5a2.5 2.5 0 0 1-2.5 2.5H8l-4 3V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5z" />
      <path d="M8 9.5h8M8 13h5" />
    </svg>
  );
}
