// Model slug prefix → Wikipedia sayfa adı eşleşmesi
const WIKI_PAGE: Record<string, string> = {
  "togg-t10x":     "Togg_T10X",
  "togg-t10f":     "Togg_T10F",
  "tesla-model-y": "Tesla_Model_Y",
  "fiat-egea":     "Fiat_Egea",
  "renault-clio":  "Renault_Clio",
  "dacia-duster":  "Dacia_Duster",
};

function wikiPageFor(slug: string): string | undefined {
  return Object.entries(WIKI_PAGE).find(([prefix]) => slug.startsWith(prefix))?.[1];
}

export async function getVehicleImageUrl(slug: string): Promise<string | null> {
  const page = wikiPageFor(slug);
  if (!page) return null;

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${page}`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail?: { source: string } };
    const src = data.thumbnail?.source;
    if (!src) return null;
    return src;
  } catch {
    return null;
  }
}

// Birden fazla araç için paralel çekme
export async function getVehicleImageUrls(
  slugs: string[]
): Promise<Record<string, string | null>> {
  const results = await Promise.all(
    slugs.map(async (slug) => [slug, await getVehicleImageUrl(slug)] as const)
  );
  return Object.fromEntries(results);
}
