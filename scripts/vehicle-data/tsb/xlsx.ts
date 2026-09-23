/**
 * TSB Kasko Değer Listesi .xlsx okuyucu — bağımlılıksız.
 *
 * .xlsx bir zip arşivi; TSB dosyası tek sayfa ve hücreler inlineStr olarak
 * geliyor (sharedStrings yok). Zip'in merkez dizininden sheet1.xml'i bulup
 * zlib ile açıyoruz; genel amaçlı bir Excel okuyucu değil.
 */
import fs from "fs";
import zlib from "zlib";

export type TsbRow = {
  markaKodu: string;
  tipKodu: string;
  marka: string;
  tip: string;
  /** Kasko değeri girilmiş (= o model yılında satılmış) yıllar, büyükten küçüğe. */
  yillar: number[];
};

function readZipEntry(buf: Buffer, name: string): Buffer {
  // End of Central Directory kaydı dosyanın son 64KB'ı içinde.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error("Geçerli bir .xlsx (zip) dosyası değil");

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const entryName = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (entryName === name) {
      const lNameLen = buf.readUInt16LE(localOffset + 26);
      const lExtraLen = buf.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(start, start + compSize);
      return method === 0 ? data : zlib.inflateRawSync(data);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`${name} arşivde bulunamadı`);
}

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

export function readTsbXlsx(file: string): { baslik: string; rows: TsbRow[] } {
  const xml = readZipEntry(fs.readFileSync(file), "xl/worksheets/sheet1.xml").toString("utf8");

  const rawRows: Record<string, string>[] = [];
  const rowRe = /<x:row [^>]*>([\s\S]*?)<\/x:row>/g;
  const cellRe = /<x:c r="([A-Z]+)\d+"[^>]*?(?:\/>|>([\s\S]*?)<\/x:c>)/g;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(xml))) {
    const cells: Record<string, string> = {};
    let c: RegExpExecArray | null;
    cellRe.lastIndex = 0;
    while ((c = cellRe.exec(m[1]))) {
      if (!c[2]) continue;
      const t = c[2].match(/<x:t[^>]*>([\s\S]*?)<\/x:t>/) ?? c[2].match(/<x:v>([\s\S]*?)<\/x:v>/);
      if (t) cells[c[1]] = decode(t[1]).trim();
    }
    rawRows.push(cells);
  }

  // 1. satır başlık ("Eylül 2026"), 2. satır sütun adları.
  const [titleRow, header, ...body] = rawRows;
  if (header?.A !== "Marka Kodu" || header?.D !== "Tip Adı") {
    throw new Error("Beklenmeyen TSB sütun düzeni — dosya formatı değişmiş olabilir");
  }
  const yearCols = Object.entries(header).filter(([, v]) => /^\d{4}$/.test(v));

  const rows = body
    .filter((r) => r.D)
    .map((r) => ({
      markaKodu: r.A,
      tipKodu: r.B,
      marka: r.C,
      tip: r.D,
      yillar: yearCols.filter(([col]) => r[col] && Number(r[col]) > 0).map(([, y]) => Number(y)),
    }));

  return { baslik: titleRow?.A ?? "", rows };
}
