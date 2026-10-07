import Image from "next/image";
import { getImageBackdrop } from "@/lib/imageBackdrop";

/**
 * Küçük ürün görseli (relative + overflow-hidden bir kabın içinde): zemin düzse kap o renge boyanır ve fotoğraf
 * sığdırılır, zemin düz değilse fotoğraf kabı doldurur (bkz. imageBackdrop.ts). Sunucu bileşeni.
 */
export async function BackdropImage({
  src, alt, sizes, className = "", padding = "p-2",
}: { src: string; alt: string; sizes: string; className?: string; padding?: string }) {
  const b = await getImageBackdrop(src);
  if (b.kind === "busy") {
    return <Image src={src} alt={alt} fill sizes={sizes} className={`object-cover ${className}`} />;
  }
  return (
    <>
      {b.kind === "plain" && <div aria-hidden className="absolute inset-0" style={{ backgroundColor: b.color }} />}
      <Image src={src} alt={alt} fill sizes={sizes} className={`object-contain ${padding} ${className}`} />
    </>
  );
}
