import { NextResponse } from "next/server";
import { rateLimitByIp } from "@/lib/rateLimit";

// CSP ihlal raporları (bkz. next.config.ts: zorlanan politika + Report-Only aday). Amaç: gerçek kullanıcılarda neyin
// engellendiğini/engelleneceğini günlükte okunur ve tekrarsız görmek. Tek satır: [csp-report] <zorla|rapor> yönerge → engellenen @ sayfa.
// Tarayıcı eklentisi gürültüsü atılır; sorgu dizesi (kişisel veri taşıyabilir) kaydedilmez.

const EKLENTI = /^(chrome-extension|moz-extension|safari-extension|safari-web-extension|webkit-masked-url|ms-browser-extension):/i;
const GORULEN = new Set<string>(); // örnek (instance) başına tekrar sayacı — günlük taşmasın
const GORULEN_ES = 500;

type Rapor = Record<string, unknown>;

/** Log satırı sahteciliğini önler: kontrol karakterleri (satır sonları dahil) atılır, uzunluk kırpılır. */
function temiz(deger: unknown, max = 80): string {
  return String(deger ?? "").replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, " ").slice(0, max);
}

function yolOnlu(girdi: unknown): string {
  if (typeof girdi !== "string" || !girdi) return "-";
  const adres = temiz(girdi, 500);
  if (!/^[a-z][a-z0-9+.-]*:/i.test(adres)) return adres.slice(0, 80); // "inline", "eval", "data"…
  try {
    const u = new URL(adres);
    return `${u.origin}${u.pathname}`.slice(0, 160);
  } catch {
    return adres.slice(0, 80);
  }
}

function duzlestir(govde: unknown): Rapor[] {
  if (Array.isArray(govde)) {
    // Reporting API biçimi: [{ type: "csp-violation", body: { documentURL, effectiveDirective, blockedURL, … } }]
    return govde
      .filter((r): r is Rapor => !!r && typeof r === "object" && (r as Rapor).type === "csp-violation")
      .map((r) => {
        const b = ((r as Rapor).body ?? {}) as Rapor;
        return {
          "document-uri": b.documentURL, "effective-directive": b.effectiveDirective, "blocked-uri": b.blockedURL,
          "source-file": b.sourceFile, "line-number": b.lineNumber, disposition: b.disposition,
        };
      });
  }
  const r = govde && typeof govde === "object" ? (govde as Rapor)["csp-report"] : null;
  return r && typeof r === "object" ? [r as Rapor] : [];
}

export async function POST(req: Request) {
  if (!(await rateLimitByIp(req, "csp-report", 60, 60 * 60 * 1000))) return new NextResponse(null, { status: 204 });
  try {
    // Gövdeyi okumadan önce boyut sınırı (büyük gövdeyle belleği/CPU'yu meşgul etmeyi önler)
    if (Number(req.headers.get("content-length") ?? 0) > 20_000) return new NextResponse(null, { status: 204 });
    const metin = (await req.text()).slice(0, 8000);
    for (const r of duzlestir(JSON.parse(metin))) {
      const engellenen = String(r["blocked-uri"] ?? "");
      const kaynak = String(r["source-file"] ?? "");
      if (EKLENTI.test(engellenen) || EKLENTI.test(kaynak)) continue;
      const yonerge = temiz(String(r["effective-directive"] ?? r["violated-directive"] ?? "?").split(" ")[0], 40);
      const mod = r.disposition === "report" ? "rapor" : "zorla";
      const satir = `${mod} ${yonerge} → ${yolOnlu(engellenen || "inline")} @ ${yolOnlu(r["document-uri"])}`;
      if (GORULEN.has(satir)) continue;
      if (GORULEN.size >= GORULEN_ES) GORULEN.clear();
      GORULEN.add(satir);
      console.warn("[csp-report]", satir, kaynak && !EKLENTI.test(kaynak) ? `(kaynak ${yolOnlu(kaynak)}:${temiz(r["line-number"], 10)})` : "");
    }
  } catch {
    /* geçersiz gövde önemsiz */
  }
  return new NextResponse(null, { status: 204 });
}
