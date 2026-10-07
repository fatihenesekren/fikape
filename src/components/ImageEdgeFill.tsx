import { getImageProps } from "next/image";

/**
 * Fotoğrafı kutuya `object-contain` ile sığdırınca kalan boşlukları fotoğrafın KENAR rengiyle doldurur
 * ("kutu içinde kutu" görünümünü önler). Sol yarı fotoğrafın sol kenarındaki, sağ yarı sağ kenarındaki
 * renkten üretilir: beyaz zeminli fotoğrafta beyaz, stüdyo gri zeminde o gri, geçişli zeminde geçişli dolgu olur.
 * Üstüne net fotoğraf (object-contain) konur. Kabın `relative overflow-hidden` olması gerekir.
 */
export function ImageEdgeFill({ src }: { src: string }) {
  // Küçük, optimize edilmiş kopya yeter (dolgu zaten yatayda gerilip yumuşatılıyor)
  const { props } = getImageProps({ src, alt: "", width: 96, height: 96 });
  const bg = `url("${props.src}")`;
  const ortak = { backgroundImage: bg, backgroundSize: "1200% 100%", backgroundRepeat: "no-repeat" } as const;
  return (
    <div aria-hidden className="absolute -inset-2 pointer-events-none blur-md">
      <div className="absolute inset-y-0 left-0 w-1/2" style={{ ...ortak, backgroundPosition: "0% 50%" }} />
      <div className="absolute inset-y-0 right-0 w-1/2" style={{ ...ortak, backgroundPosition: "100% 50%" }} />
    </div>
  );
}
