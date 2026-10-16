import Image from "next/image";
import { BUSY_SIGDIR_ESIGI, getImageBackdrop, getImageOran } from "@/lib/imageBackdrop";

// Fotoğrafın kenarlarını yumuşatan maske: kutu içinde belirgin bir dikdörtgen ("foto içinde foto") görünmez,
// fotoğraf arkadaki bulanık kopyasına karışır. İki doğrusal gradyanın kesişimi: yanlarda belirgin, üst-altta (kart kenarına
// dayandığı için) hafif solma.
const KENAR_MASKESI = [
  "linear-gradient(to right, transparent 0, #000 20%, #000 80%, transparent 100%)",
  "linear-gradient(to bottom, transparent 0, #000 5%, #000 95%, transparent 100%)",
].join(", ");

/**
 * Küçük ürün görseli (relative + overflow-hidden bir kabın içinde): zemin düzse kap o renge boyanır ve fotoğraf
 * sığdırılır, zemin düz değilse fotoğraf kabı doldurur (bkz. imageBackdrop.ts). Zemin düz değil ama fotoğraf kareye
 * yakınsa (oran < BUSY_SIGDIR_ESIGI) doldurmak aracı keser; bu durumda fotoğraf kendi bulanık kopyasının üzerine
 * sığdırılır ve kenarları bulanık zemine karışacak biçimde yumuşatılır (dikeyNesne=true: kartlarda e-scooter,
 * e-bisiklet ve motosiklet). Sunucu bileşeni.
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
          <Image src={src} alt="" aria-hidden fill sizes={sizes} className="object-cover scale-110 blur-2xl" />
          <div className={`absolute inset-0 flex items-center justify-center ${padding}`}>
            {/* Fotoğrafın kendi en/boy oranında kutu: maske yalnız görünen fotoğrafın kenarlarına uygulanır */}
            <div
              className="relative h-full max-w-full"
              style={{
                aspectRatio: String(oran),
                WebkitMaskImage: KENAR_MASKESI,
                maskImage: KENAR_MASKESI,
                WebkitMaskComposite: "source-in",
                maskComposite: "intersect",
              }}
            >
              <Image src={src} alt={alt} fill sizes={sizes} className={`object-contain ${className}`} />
            </div>
          </div>
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
