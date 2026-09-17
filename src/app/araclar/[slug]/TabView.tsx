"use client";

import { useState } from "react";
import { ReportContent } from "./ReportContent";

type Tab = "yorumlar" | "teknik" | "soru-cevap" | "usta-gorusleri";

interface Props {
  reviewCount: number;
  reviewsContent: React.ReactNode;
  specsContent: React.ReactNode;
  questionCount: number;
  qnaContent: React.ReactNode;
  hasExpertNotes: boolean;
  expertNoteCount: number;
  expertNotesContent: React.ReactNode;
  canWriteExpertNote: boolean;
  initialTab?: Tab;
  productId: number;
  categorySlug: string;
  isLoggedIn: boolean;
  reviewsForReport: { id: number; label: string }[];
  questionsForReport: { id: number; label: string }[];
  photosForReport: { id: number; label: string }[];
  notesForReport: { id: number; label: string }[];
}

export function TabView({
  reviewCount, reviewsContent, specsContent, questionCount, qnaContent,
  hasExpertNotes, expertNoteCount, expertNotesContent, canWriteExpertNote, initialTab,
  productId, categorySlug, isLoggedIn, reviewsForReport, questionsForReport, photosForReport, notesForReport,
}: Props) {
  // Sekme, not varsa HERKESE, not yoksa yalnız yazabilecek (aktif usta)
  // kullanıcıya görünür — boş sekmeyi sıradan kullanıcıya göstermenin
  // anlamı yok, ama aktif usta 0 nottayken de kendi yazma CTA'sına
  // ulaşabilmeli (bkz. feature_usta_gorusleri_ilerleme).
  const showExpertTab = hasExpertNotes || canWriteExpertNote;
  const safeInitial: Tab =
    initialTab === "usta-gorusleri" && !showExpertTab ? "yorumlar" : (initialTab ?? "yorumlar");
  const [tab, setTab] = useState<Tab>(safeInitial);

  // Sekmeler tek yerden — masaüstü (alt çizgili şerit) VE mobil (2 satırlık
  // ızgara) aynı listeden render ediyor, tekrar yazmaya gerek kalmıyor.
  // Kök bug: eski buton className'inde whitespace-nowrap yoktu, dar
  // ekranda "Usta Görüşleri"/"Teknik Özellikler" 2 satıra bölünüyordu
  // (kullanıcı gerçek cihazdan gösterdi). Kısaltma denendi ("Usta" tek
  // başına anlaşılmıyor, kullanıcı reddetti) — yerine 3 ajanlı tasarım
  // denetiminden çıkan, tam etiketleri koruyan 2 satırlık ızgara mobile
  // özel eklendi; masaüstünde eski şerit aynen kalıyor.
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "yorumlar", label: "Yorumlar", count: reviewCount },
    // Usta Görüşleri — bu modelde yayınlanmış not varsa HERKESE (§6),
    // yoksa yalnız yazabilecek aktif ustaya görünür
    ...(showExpertTab ? [{ key: "usta-gorusleri" as Tab, label: "Usta Görüşleri", count: expertNoteCount }] : []),
    { key: "teknik", label: "Teknik Özellikler" },
    { key: "soru-cevap", label: "Soru-Cevap", count: questionCount },
  ];

  return (
    <div>
      {/* Masaüstü — mevcut alt çizgili sekme şeridi, whitespace-nowrap
          eklendi (güvenlik amaçlı, geniş ekranda zaten sığıyordu). */}
      <div className="hidden sm:flex items-center border-b border-gray-100 bg-white rounded-t-2xl px-1 overflow-x-auto">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === key
                ? "text-gray-900 border-gray-900"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            {label}
            {count != null && count > 0 && <span className="ml-1.5 text-xs text-gray-400">{count}</span>}
          </button>
        ))}
      </div>

      {/* Mobil — 2 satırlık ızgara. 3 veya daha az sekme tek satıra,
          4'ü (Usta Görüşleri eklenince) 2x2'ye sığıyor — hiç kaydırma
          veya kısaltma yok, tüm etiketler tam okunaklı. */}
      <div
        className="grid sm:hidden gap-1.5 mb-3"
        style={{ gridTemplateColumns: `repeat(${tabs.length <= 3 ? tabs.length : 2}, minmax(0, 1fr))` }}
      >
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
              tab === key
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {label}
            {count != null && count > 0 && (
              <span className={tab === key ? "opacity-70" : "text-gray-400"}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab içerikleri — min-height ile yükseklik sabit. Mobil ızgara
          artık şeride bitişik değil, kendi kapalı kartı — bu yüzden
          içerik kutusu mobilde tam rounded-2xl+border, sadece sm ve
          üstünde masaüstü şeridine bitişecek şekilde üstü açılıyor. */}
      {tab === "yorumlar" && (
        <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-t-none sm:border-t-0 min-h-[320px]">{reviewsContent}</div>
      )}
      {tab === "usta-gorusleri" && (
        <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-t-none sm:border-t-0 min-h-[320px]">{expertNotesContent}</div>
      )}
      {tab === "teknik" && (
        <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-t-none sm:border-t-0 min-h-[320px]">{specsContent}</div>
      )}
      {tab === "soru-cevap" && (
        <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-t-none sm:border-t-0 min-h-[320px]">{qnaContent}</div>
      )}

      {/* İçerik hatası bildirimi — önceden usta görüşleri sekmesinde
          gizliydi ("Aşama 4'e ertelendi" notuyla), ama şema/admin tarafı
          (ContentReportTargetType.EXPERT_NOTE) zaten hazırdı — kullanıcı
          fark edip tamamlanmasını istedi, artık her sekmede aynı akış var. */}
      <ReportContent
        productId={productId}
        categorySlug={categorySlug}
        isLoggedIn={isLoggedIn}
        activeTab={tab}
        reviewsForReport={reviewsForReport}
        questionsForReport={questionsForReport}
        photosForReport={photosForReport}
        notesForReport={notesForReport}
      />
    </div>
  );
}
