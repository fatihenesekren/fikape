// Kullanıcı yorum/öneri fotoğraflarına yükleme anında (tarayıcıda) soluk bir
// "fikape.com" filigranı basar — amaç, fotoğrafın başka bir sitede (örn.
// ilan sitelerinde) izinsiz kullanılması durumunda kaynağını belli etmek.
// Bilinçli olarak SUNUCU tarafında değil TARAYICIDA yapılıyor: fotoğraf
// yükleme @vercel/blob/client ile doğrudan tarayıcıdan Blob'a gidiyor
// (bkz. fix_foto_yukleme_vercel_body_limit), dosyayı tekrar sunucudan
// geçirmek aynı 4.5MB serverless body limitini geri getirirdi.
export async function watermarkImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0);

  const fontSize = Math.max(14, Math.round(canvas.width * 0.02));
  const padding = Math.round(fontSize * 0.8);
  const text = "fikape.com";

  ctx.font = `600 ${fontSize}px -apple-system, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";

  // Her arka planda (açık/koyu fotoğraf) okunaklı kalması için ince koyu
  // gölge + soluk beyaz metin.
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = fontSize * 0.25;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(text, canvas.width - padding, padding);

  const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, mimeType, 0.92)
  );
  if (!blob) return file;

  return new File([blob], file.name, { type: mimeType });
}
