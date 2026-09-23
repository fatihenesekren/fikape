/**
 * Motosiklet TSB tipini ayrıştırır.
 *
 * Otomobilden farklı olarak model/motor/paket AYRILMAZ — motor kodu model
 * adının kendisine gömülü olduğu için ("CBF 500", "GSX-R1000", "FLSTF FAT
 * BOY") güvenli bir ayrım yapmak mümkün değil (bkz. motoRules.ts başlık
 * yorumu ve kullanıcı onayı). Marka'dan sonraki metin — yalnızca ABS/emisyon
 * gibi saf gürültü atılarak — TEK PARÇA model adı olarak kullanılır.
 *
 * Yakıt: yalnızca "ELEKTRİK/ELECTRIC/KWH" gibi açık işaret varsa Elektrikli;
 * aksi halde Benzin (motosikletlerde dizel/hibrit fiilen yok). Vites hiç
 * çıkarılmaz — kullanıcıya sorulur.
 */
import {
  MOTO_COK_KELIMELI_MARKALAR, MOTO_DISHI_MARKALAR, MOTO_DISHI_RE, MOTO_EV_RE,
  MOTO_GURULTU_RE, MOTO_MARKA_ALIAS, MOTO_SADECE_EV_MARKALAR, foldMoto,
} from "./motoRules";
import { titleCase } from "./parseTip";

export type MotoYakit = "GASOLINE" | "EV";

export type ParsedMotoTip = {
  make: string;
  modelKey: string;
  model: string;
  yakit: MotoYakit;
};

export type ParseMotoResult = { ok: true; value: ParsedMotoTip } | { ok: false; neden: string };

export function parseMotoTip(tipAdi: string): ParseMotoResult {
  const text = foldMoto(tipAdi).replace(/\\/g, " ").replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, neden: "bos-tip" };
  if (MOTO_DISHI_RE.test(text)) return { ok: false, neden: "atv-utv-quad" };

  const tokens = text.split(" ");

  let make: string | null = null;
  let consumed = 0;
  for (const [prefix, ad] of MOTO_COK_KELIMELI_MARKALAR) {
    const parcalar = prefix.split(" ");
    if (parcalar.every((p, i) => tokens[i] === p)) { make = ad; consumed = parcalar.length; break; }
  }
  if (!make) {
    const ilk = tokens[0];
    make = MOTO_MARKA_ALIAS[ilk] ?? titleCase(ilk);
    consumed = 1;
  }

  const makeAnahtar = foldMoto(make).replace(/[^A-Z0-9]/g, "");
  if (MOTO_DISHI_MARKALAR.has(makeAnahtar)) return { ok: false, neden: "atv-utv-marka" };

  const rest = tokens.slice(consumed).filter((w) => !MOTO_GURULTU_RE.test(w));
  if (!rest.length) return { ok: false, neden: "model-yok" };

  const modelKey = rest.join(" ");
  const yakit: MotoYakit = MOTO_EV_RE.test(text) || MOTO_SADECE_EV_MARKALAR.has(make) ? "EV" : "GASOLINE";

  return { ok: true, value: { make, modelKey, model: titleCase(modelKey), yakit } };
}
