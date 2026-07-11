import { getInitials, getAvatarColor } from "@/lib/avatar";

interface AvatarProps {
  displayName: string | null;
  avatarUrl?: string | null;
  seed: string;
  size?: number;
  className?: string;
}

export function Avatar({ displayName, avatarUrl, seed, size = 36, className = "" }: AvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- dışarıdan üretilen SVG (DiceBear), next/image proxy'sine gerek yok
      <img
        src={avatarUrl}
        alt={displayName ?? "Kullanıcı"}
        width={size}
        height={size}
        className={`rounded-full shrink-0 object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = getInitials(displayName);
  const bg = getAvatarColor(seed);
  const fontSize = size <= 28 ? 11 : size <= 36 ? 13 : 16;

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white shrink-0 ${className}`}
      style={{ width: size, height: size, background: bg, fontSize }}
    >
      {initials}
    </div>
  );
}
