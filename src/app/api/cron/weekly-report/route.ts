import { NextResponse } from "next/server";
import { sendWeeklyReport } from "@/lib/reports/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Haftalık admin özet raporu — Pazartesi 05:00 UTC (bkz. vercel.json).
 * Diğer cron'lar gibi Bearer CRON_SECRET ile korunur.
 *
 * Test:
 *   ?dry=1              → e-posta göndermeden HTML döndürür
 *   ?dry=1&format=text  → düz metin
 *   ?dry=1&format=json  → ham veri + özet
 * `dry` yalnızca prod DIŞINDA secret'ı query param olarak kabul eder; prod'da
 * her durumda Authorization header şart.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const isProd = !!process.env.VERCEL || process.env.NODE_ENV === "production";
  const headerOk = req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  const queryOk = !isProd && url.searchParams.get("secret") === process.env.CRON_SECRET;
  if (!headerOk && !queryOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = url.searchParams.get("dry") === "1";
  const format = url.searchParams.get("format");

  const startedAt = Date.now();
  const result = await sendWeeklyReport({ dryRun: dry });

  console.log(
    `[cron/weekly-report] isoWeek=${result.isoWeek} dry=${dry} recipients=${result.recipients}` +
      ` deduped=${!!result.deduped} sectionErrors=${result.sectionErrors.length} durationMs=${Date.now() - startedAt}`,
  );

  if (dry && format === "text") {
    return new NextResponse(result.text ?? "", { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  if (dry && (format === "html" || !format)) {
    return new NextResponse(result.html ?? "", { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  if (dry && format === "json") {
    return NextResponse.json({
      isoWeek: result.isoWeek,
      subject: result.subject,
      recipients: result.recipients,
      sectionErrors: result.sectionErrors,
      data: result.data,
    });
  }

  return NextResponse.json({
    ok: result.ok,
    isoWeek: result.isoWeek,
    deduped: result.deduped ?? false,
    recipients: result.recipients,
    sectionErrors: result.sectionErrors.length,
  });
}
