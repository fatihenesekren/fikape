"use client";

import { useState } from "react";
import { ReportContent } from "./ReportContent";

interface Props {
  reviewCount: number;
  reviewsContent: React.ReactNode;
  specsContent: React.ReactNode;
  questionCount: number;
  qnaContent: React.ReactNode;
  initialTab?: "yorumlar" | "teknik" | "soru-cevap";
  productId: number;
  categorySlug: string;
  isLoggedIn: boolean;
  reviewsForReport: { id: number; label: string }[];
  questionsForReport: { id: number; label: string }[];
  photosForReport: { id: number; label: string }[];
}

export function TabView({
  reviewCount, reviewsContent, specsContent, questionCount, qnaContent, initialTab,
  productId, categorySlug, isLoggedIn, reviewsForReport, questionsForReport, photosForReport,
}: Props) {
  const [tab, setTab] = useState<"yorumlar" | "teknik" | "soru-cevap">(initialTab ?? "yorumlar");

  return (
    <div>
      {/* Tab başlıkları */}
      <div className="flex items-center border-b border-gray-100 bg-white rounded-t-2xl px-1">
        <button
          onClick={() => setTab("yorumlar")}
          className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "yorumlar"
              ? "text-gray-900 border-gray-900"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          Yorumlar
          {reviewCount > 0 && (
            <span className="ml-1.5 text-xs text-gray-400">{reviewCount}</span>
          )}
        </button>
        <button
          onClick={() => setTab("teknik")}
          className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "teknik"
              ? "text-gray-900 border-gray-900"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          Teknik Özellikler
        </button>
        <button
          onClick={() => setTab("soru-cevap")}
          className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "soru-cevap"
              ? "text-gray-900 border-gray-900"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          Soru-Cevap
          {questionCount > 0 && (
            <span className="ml-1.5 text-xs text-gray-400">{questionCount}</span>
          )}
        </button>

      </div>

      {/* Tab içerikleri — min-height ile yükseklik sabit */}
      {tab === "yorumlar" && (
        <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl min-h-[320px]">
          {reviewsContent}
        </div>
      )}
      {tab === "teknik" && (
        <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl min-h-[320px]">
          {specsContent}
        </div>
      )}
      {tab === "soru-cevap" && (
        <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl min-h-[320px]">
          {qnaContent}
        </div>
      )}

      <ReportContent
        productId={productId}
        categorySlug={categorySlug}
        isLoggedIn={isLoggedIn}
        activeTab={tab}
        reviewsForReport={reviewsForReport}
        questionsForReport={questionsForReport}
        photosForReport={photosForReport}
      />
    </div>
  );
}
