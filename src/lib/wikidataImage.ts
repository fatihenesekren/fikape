// Wikipedia düz metin araması "ilk sonucu kör güvenle al" yaklaşımı yanlış
// eşleşmeler üretiyordu (ör. Abarth modellerine Fiat fotoğrafı, farklı Alfa
// Romeo nesillerine aynı/yanlış nesil fotoğrafı, bazı modellere sadece marka
// logosu). Wikidata yapılandırılmış veri sunduğu için üreticiyi (P176) ve
// üretim yılını (P571) doğrulayarak seçim yapıyoruz — eşleşme bulunamazsa
// görsel boş bırakılır, YANLIŞ görsel yazılmaz.

const WD_HEADERS = { "User-Agent": "fikape.com/1.0 (https://fikape.com; info@fikape.com)" };

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Mn}/gu, "").replace(/[^a-z0-9]/g, "");
}

interface WdSearchResult { id: string; label: string; }

async function wbSearch(query: string): Promise<WdSearchResult[]> {
  try {
    const res = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&type=item&limit=5&format=json`,
      { signal: AbortSignal.timeout(5000), headers: WD_HEADERS }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.search ?? []).map((r: { id: string; label: string }) => ({ id: r.id, label: r.label }));
  } catch { return []; }
}

type WdEntity = {
  claims: Record<string, { mainsnak: { datavalue?: { value: unknown } } }[]>;
};

async function wbGetEntities(ids: string[]): Promise<Record<string, WdEntity>> {
  if (ids.length === 0) return {};
  try {
    const res = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join("|")}&props=claims&format=json`,
      { signal: AbortSignal.timeout(6000), headers: WD_HEADERS }
    );
    if (!res.ok) return {};
    const data = await res.json();
    return data.entities ?? {};
  } catch { return {}; }
}

async function wbGetLabels(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  try {
    const res = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join("|")}&props=labels&languages=en&format=json`,
      { signal: AbortSignal.timeout(6000), headers: WD_HEADERS }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const out: Record<string, string> = {};
    for (const id of ids) {
      out[id] = data.entities?.[id]?.labels?.en?.value ?? "";
    }
    return out;
  } catch { return {}; }
}

function claimValue(entity: WdEntity, prop: string): unknown {
  return entity.claims?.[prop]?.[0]?.mainsnak?.datavalue?.value;
}

function claimEntityId(entity: WdEntity, prop: string): string | null {
  const v = claimValue(entity, prop) as { id?: string } | undefined;
  return v?.id ?? null;
}

function inceptionYear(entity: WdEntity): number | null {
  const v = claimValue(entity, "P571") as { time?: string } | undefined;
  if (!v?.time) return null;
  const m = v.time.match(/^\+(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

export async function findVerifiedVehicleImage(
  brand: string, model: string, year: number | null
): Promise<string | null> {
  const cleanModel = model.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const candidates = await wbSearch(`${brand} ${cleanModel}`);
  if (candidates.length === 0) return null;

  const entities = await wbGetEntities(candidates.map((c) => c.id));

  const manufacturerIds = [...new Set(
    Object.values(entities).map((e) => claimEntityId(e, "P176")).filter((id): id is string => !!id)
  )];
  const manufacturerLabels = await wbGetLabels(manufacturerIds);

  const brandN = normalize(brand);
  // Modelin ilk kelimesi eşleşme için yeterli (ör. "Corolla Cross" için "corolla")
  const modelFirstWordN = normalize(cleanModel.split(" ")[0] ?? cleanModel);

  const verified = candidates
    .map((c) => ({ ...c, entity: entities[c.id] }))
    .filter((c) => c.entity)
    .filter((c) => {
      const labelN = normalize(c.label);
      // Etiket sadece markanın kendisi olamaz (ör. sadece "Alfa Romeo") —
      // marka LOGOSU gibi ilgisiz bir görsel yakalama riskine karşı, model
      // adının da etikette geçmesi şart.
      if (!labelN.includes(modelFirstWordN)) return false;

      const mfrId = claimEntityId(c.entity, "P176");
      const mfrLabel = mfrId ? manufacturerLabels[mfrId] ?? "" : "";
      const mfrMatches = mfrLabel !== "" && normalize(mfrLabel).includes(brandN);
      // Üretici verisi hiç yoksa, sonucun kendi etiketi markayla başlıyor mu diye bak
      // (ör. "Abarth 500e" — P176 boş olsa da etiketin kendisi markayı doğruluyor)
      const labelMatches = labelN.startsWith(brandN);
      return mfrMatches || labelMatches;
    });

  // Belirsizlik = yanlış veri riski. Aynı nameplate'in birden fazla nesli
  // (ör. "Giulietta" 1960'lardan 2010'lara kadar 4 farklı Wikidata kaydı)
  // P571 (üretim yılı) neredeyse hiç dolu olmadığı için güvenilir şekilde
  // ayrıştırılamıyor — tahmin etmek yerine boş bırakıyoruz.
  if (verified.length !== 1) return null;

  const best = verified[0];

  // Yıl bilgisi varsa ve adayın P571'i de doluysa, aşırı sapma varsa
  // (muhtemelen yanlış/klasik bir model) yine de reddet.
  if (year != null) {
    const iy = inceptionYear(best.entity);
    if (iy != null && Math.abs(iy - year) > 20) return null;
  }

  const image = claimValue(best.entity, "P18") as string | undefined;
  if (!image) return null;

  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(image)}?width=800`;
}
