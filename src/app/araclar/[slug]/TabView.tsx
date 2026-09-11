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
  initialTab?: Tab;
  productId: number;
  categorySlug: string;
  isLoggedIn: boolean;
  reviewsForReport: { id: number; label: string }[];
  questionsForReport: { id: number; label: string }[];
  photosForReport: { id: number; label: string }[];
}

export function TabView({
  reviewCount, reviewsContent, specsContent, questionCount, qnaContent,
  hasExpertNotes, expertNoteCount, expertNotesContent, initialTab,
  productId, categorySlug, isLoggedIn, reviewsForReport, questionsForReport, photosForReport,
}: Props) {
  const safeInitial: Tab =
    initialTab === "usta-gorusleri" && !hasExpertNotes ? "yorumlar" : (initialTab ?? "yorumlar");
  const [tab, setTab] = useState<Tab>(safeInitial);

  const tabBtn = (t: Tab, label: string, count?: number) => (
    <button
      onClick={() => setTab(t)}
      className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
        tab === t
          ? "text-gray-900 border-gray-900"
          : "text-gray-400 border-transparent hover:text-gray-600"
      }`}
    >
      {label}
      {count != null && count > 0 && <span className="ml-1.5 text-xs text-gray-400">{count}</span>}
    </button>
  );

  return (
    <div>
      {/* Tab başlıkları */}
      <div className="flex items-center border-b border-gray-100 bg-white rounded-t-2xl px-1 overflow-x-auto">
        {tabBtn("yorumlar", "Yorumlar", reviewCount)}
        {/* Usta Görüşleri — yalnızca bu modelde yayınlanmış not varsa görünür (§6) */}
        {hasExpertNotes && tabBtn("usta-gorusleri", "Usta Görüşleri", expertNoteCount)}
        {tabBtn("teknik", "Teknik Özellikler")}
        {tabBtn("soru-cevap", "Soru-Cevap", questionCount)}
      </div>

      {/* Tab içerikleri — min-height ile yükseklik sabit */}
      {tab === "yorumlar" && (
        <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl min-h-[320px]">{reviewsContent}</div>
      )}
      {tab === "usta-gorusleri" && (
        <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl min-h-[320px]">{expertNotesContent}</div>
      )}
      {tab === "teknik" && (
        <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl min-h-[320px]">{specsContent}</div>
      )}
      {tab === "soru-cevap" && (
        <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl min-h-[320px]">{qnaContent}</div>
      )}

      {/* İçerik hatası bildirimi — usta görüşleri için ayrı akış (Aşama 4), burada gizli */}
      {tab !== "usta-gorusleri" && (
        <ReportContent
          productId={productId}
          categorySlug={categorySlug}
          isLoggedIn={isLoggedIn}
          activeTab={tab}
          reviewsForReport={reviewsForReport}
          questionsForReport={questionsForReport}
          photosForReport={photosForReport}
        />
      )}
    </div>
  );
}
