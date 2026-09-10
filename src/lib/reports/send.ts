import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { sendAdminAlertEmail } from "@/lib/email";
import { REPORT_FROM } from "./theme";
import { isoWeekWindow } from "./format";
import { collectWeeklyReport, type WeeklyReportData } from "./collect";
import { renderWeeklyReportHtml, renderWeeklyReportText, reportSubject } from "./render";

const KIND = "weekly-admin";

export interface WeeklyReportResult {
  ok: boolean;
  isoWeek: string;
  deduped?: boolean;
  dryRun?: boolean;
  recipients: number;
  sectionErrors: string[];
  subject: string;
  html?: string;
  text?: string;
  data?: WeeklyReportData;
}

/** REPORT_RECIPIENTS env verilmişse ona, yoksa trustLevel>=5 kullanıcılara. */
async function resolveRecipients(): Promise<string[]> {
  const override = process.env.REPORT_RECIPIENTS?.trim();
  if (override) {
    return override.split(",").map((s) => s.trim()).filter((s) => s.includes("@"));
  }
  const admins = await prisma.user.findMany({
    where: { trustLevel: { gte: 5 }, isBanned: false },
    select: { email: true },
  });
  return admins.map((a) => a.email).filter(Boolean);
}

export async function sendWeeklyReport(opts: { dryRun?: boolean; now?: Date } = {}): Promise<WeeklyReportResult> {
  const win = isoWeekWindow(opts.now);
  const dryRun = !!opts.dryRun;

  // ── Kuru koşu: hiçbir yan etki yok (ReportRun yazılmaz, e-posta gönderilmez) ──
  if (dryRun) {
    const data = await collectWeeklyReport(win);
    const html = renderWeeklyReportHtml(data);
    const text = renderWeeklyReportText(data);
    const recipients = await resolveRecipients();
    return {
      ok: true, dryRun: true, isoWeek: win.isoWeek, recipients: recipients.length,
      sectionErrors: data.sectionErrors, subject: reportSubject(data), html, text, data,
    };
  }

  // ── Haftayı sahiplen (çift-ateşleme koruması) ──
  try {
    await prisma.reportRun.create({ data: { kind: KIND, isoWeek: win.isoWeek, status: "RUNNING" } });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code !== "P2002") throw e;
    const existing = await prisma.reportRun.findUnique({ where: { kind_isoWeek: { kind: KIND, isoWeek: win.isoWeek } } });
    if (existing?.status === "SENT") {
      return { ok: true, deduped: true, isoWeek: win.isoWeek, recipients: existing.recipientCount ?? 0, sectionErrors: [], subject: "" };
    }
    const stale =
      existing?.status === "FAILED" ||
      (existing?.status === "RUNNING" && Date.now() - existing.startedAt.getTime() > 15 * 60_000);
    if (!stale) {
      return { ok: true, deduped: true, isoWeek: win.isoWeek, recipients: 0, sectionErrors: [], subject: "" };
    }
    await prisma.reportRun.update({
      where: { kind_isoWeek: { kind: KIND, isoWeek: win.isoWeek } },
      data: { status: "RUNNING", startedAt: new Date(), error: null },
    });
  }

  try {
    const data = await collectWeeklyReport(win);
    const html = renderWeeklyReportHtml(data);
    const text = renderWeeklyReportText(data);
    const subject = reportSubject(data);
    const recipients = await resolveRecipients();

    if (recipients.length === 0) {
      await prisma.reportRun.update({
        where: { kind_isoWeek: { kind: KIND, isoWeek: win.isoWeek } },
        data: { status: "SENT", finishedAt: new Date(), recipientCount: 0, summary: "alıcı yok" },
      });
      return { ok: true, isoWeek: win.isoWeek, recipients: 0, sectionErrors: data.sectionErrors, subject };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    // Alıcı başına ayrı mesaj — paylaşımlı to: yok (KVKK).
    await resend.batch.send(
      recipients.map((to) => ({
        from: REPORT_FROM,
        to,
        subject,
        html,
        text,
        replyTo: process.env.REPORT_REPLY_TO ?? undefined,
        tags: [
          { name: "type", value: "weekly_report" },
          { name: "week", value: win.isoWeek },
        ],
      })),
      { idempotencyKey: `weekly-report-${win.isoWeek}` },
    );

    await prisma.reportRun.update({
      where: { kind_isoWeek: { kind: KIND, isoWeek: win.isoWeek } },
      data: {
        status: "SENT",
        finishedAt: new Date(),
        recipientCount: recipients.length,
        summary: `${recipients.length} alıcı · ${data.sections.length} bölüm · ${data.sectionErrors.length} hata`,
        error: data.sectionErrors.length ? data.sectionErrors.join(" | ").slice(0, 2000) : null,
      },
    });

    // Arama logu retention — 90 günden eskiyi haftalık olarak temizle (fire-and-forget)
    void prisma.searchQueryLog
      .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } })
      .catch(() => {});

    return { ok: true, isoWeek: win.isoWeek, recipients: recipients.length, sectionErrors: data.sectionErrors, subject };
  } catch (e) {
    const msg = String(e).slice(0, 1500);
    await prisma.reportRun
      .update({
        where: { kind_isoWeek: { kind: KIND, isoWeek: win.isoWeek } },
        data: { status: "FAILED", finishedAt: new Date(), error: msg },
      })
      .catch(() => {});
    // Sessiz kaçırma olmasın — fallback bilgilendirme
    try {
      const admins = await prisma.user.findMany({ where: { trustLevel: { gte: 5 }, isBanned: false }, select: { email: true } });
      await Promise.all(
        admins.map((a) =>
          sendAdminAlertEmail({
            to: a.email,
            subject: "Haftalık rapor üretilemedi",
            title: `Haftalık rapor hatası — ${win.isoWeek}`,
            message: `Rapor cron'u başarısız oldu: ${msg}`,
            link: "/admin",
          }),
        ),
      );
    } catch {
      /* fallback de patlarsa yut */
    }
    throw e;
  }
}
