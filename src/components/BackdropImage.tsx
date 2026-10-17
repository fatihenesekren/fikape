import Image from "next/image";
import { BUSY_SIGDIR_ESIGI, getImageBackdrop, getImageKenarRenkleri, getImageOran } from "@/lib/imageBackdrop";

// Fotoğrafın kenarlarını yumuşatan maske: kutu içinde belirgin bir dikdörtgen ("foto içinde foto") görünmez,
// fotoğraf arkadaki bulanık kopyasına karışır. Yalnız yanlarda çok dar bir geçiş (üst-alt kart kenarına dayandığı için maske yok);
// asıl yumuşaklığı fotoğrafın kenar renklerinden oluşan zemin gradyanı sağlar.
const KENAR_MASKESI = [
  "linear-gradient(to right, transparent 0, #000 3%, #000 97%, transparent 100%)",
].join(", ");
// Sol kenar renklerinden sağ kenar renklerine yumuşak yatay geçiş (ortada dikiş çizgisi oluşmaz).
const YATAY_GECIS = "linear-gradient(to right, transparent 20%, #000 80%)";

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
      // Boşluk: fotoğrafın kendi sol/sağ kenar renkleriyle (dikey gradyan) doldurulur → kenar zemine dikişsiz karışır.
      // Kenar renkleri okunamazsa fotoğrafın bulanık kopyasına düşülür.
      const kenar = await getImageKenarRenkleri(src);
      return (
        <>
          {kenar ? (
            <>
              <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${kenar.sol.join(", ")})` }} />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom, ${kenar.sag.join(", ")})`,
                  WebkitMaskImage: YATAY_GECIS,
                  maskImage: YATAY_GECIS,
                }}
              />
            </>
          ) : (
            <Image src={src} alt="" aria-hidden fill sizes={sizes} className="object-cover scale-110 blur-lg" />
          )}
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
