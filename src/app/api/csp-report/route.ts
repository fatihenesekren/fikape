import { NextResponse } from "next/server";
import { rateLimitByIp } from "@/lib/rateLimit";

// Content-Security-Policy-Report-Only ihlal raporları (bkz. next.config.ts). Amaç: gerçek CSP'ye geçmeden önce sitenin
// kullandığı dış kaynakların (Sentry, Blob, Wikimedia, fontlar…) envanterini sunucu günlüklerinde görmek.
export async function POST(req: Request) {
  if (!(await rateLimitByIp(req, "csp-report", 60, 60 * 60 * 1000))) return new NextResponse(null, { status: 204 });
  try {
    const metin = (await req.text()).slice(0, 4000);
    console.warn("[csp-report]", metin);
  } catch {
    /* önemsiz */
  }
  return new NextResponse(null, { status: 204 });
}
