// Vercel Blob adresleri ".public.blob.vercel-storage.com" altında HER mağazaya aittir. Yalnız sonek kontrolü, bir saldırganın
// kendi Blob mağazasındaki dosyayı (onaydan sonra içeriği değiştirilebilir) bu sitenin kaydına yazmasına izin verir.
// Bu yardımcı beklenen mağaza hostunu belirler ve tam eşleşme ister.

const SONEK = ".public.blob.vercel-storage.com";

/**
 * Bu uygulamanın Blob mağaza hostu. Önce BLOB_STORE_HOST (tam host), yoksa BLOB_READ_WRITE_TOKEN'dan
 * ("vercel_blob_rw_<mağazaId>_<gizli>") türetilir. İkisi de yoksa null (yerel geliştirme).
 */
export function ownBlobHost(): string | null {
  const acik = process.env.BLOB_STORE_HOST?.trim().toLowerCase();
  if (acik) return acik.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const m = process.env.BLOB_READ_WRITE_TOKEN?.match(/^vercel_blob_rw_([A-Za-z0-9]+)_/);
  return m ? `${m[1].toLowerCase()}${SONEK}` : null;
}

/**
 * Host bu uygulamanın Blob mağazası mı? Mağaza hostu bilinmiyorsa (env yok) yalnız sonek kontrolüne düşer —
 * üretimde BLOB_READ_WRITE_TOKEN tanımlı olduğundan tam eşleşme uygulanır.
 */
export function isOwnBlobHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (!h.endsWith(SONEK)) return false;
  const own = ownBlobHost();
  return own ? h === own : true;
}
