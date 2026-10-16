import Image from "next/image";
import { BUSY_SIGDIR_ESIGI, getImageBackdrop, getImageOran } from "@/lib/imageBackdrop";

/**
 * Küçük ürün görseli (relative + overflow-hidden bir kabın içinde): zemin düzse kap o renge boyanır ve fotoğraf
 * sığdırılır, zemin düz değilse fotoğraf kabı doldurur (bkz. imageBackdrop.ts). Zemin düz değil ama fotoğraf kareye
 * yakınsa (oran < BUSY_SIGDIR_ESIGI) doldurmak aracı keser; bu durumda fotoğraf kendi bulanık kopyasının üzerine
 * sığdırılır (yalnız dikeyNesne=true: e-scooter gibi boyu uzun araçlar; motosiklet kartları cover kalır). Sunucu bileşeni.
 */
export async function BackdropImage({
  src, alt, sizes, className = "", padding = "p-2", dikeyNesne = false,
}: { src: string; alt: string; sizes: string; className?: string; padding?: string; dikeyNesne?: boolean }) {
  const b = await getImageBackdrop(src);
  if (b.kind === "busy") {
    const oran = await getImageOran(src);
    if (dikeyNesne && oran !== null && oran < BUSY_SIGDIR_ESIGI) {
      return (
        <>
          <Image src={src} alt="" aria-hidden fill sizes={sizes} className="object-cover scale-125 blur-2xl opacity-60" />
          <Image src={src} alt={alt} fill sizes={sizes} className={`object-contain ${padding} ${className}`} />
        </>
      );
    }
    return <Image src={src} alt={alt} fill sizes={sizes} className={`object-cover ${className}`} />;
  }
  return (
    <>
      {b.kind === "plain" && <div aria-hidden className="absolute inset-0" style={{ backgroundColor: b.color }} />}
      <Image src={src} alt={alt} fill sizes={sizes} className={`object-contain ${padding} ${className}`} />
    </>
  );
}
