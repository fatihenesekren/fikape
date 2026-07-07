"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ALL_CATS, QUIZ_STEPS, CAT_LABELS, CAT_TO_SLUG, SLUG_TO_CAT,
  encodeQuiz,
  type QuizAnswers, type QuizCat,
} from "@/lib/quiz";

interface Props {
  quizAnswers:         QuizAnswers | null;
  preCatSlug:          string | null;
  categoryReviewCount?: number;
}

// Kartların gri değil, marka renklerinden birine hafif çekilmesi için döngüsel ton
const TINTS = ["var(--fi-bg)", "var(--ka-bg)", "var(--pe-bg)"];

function MatchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckBadge() {
  return (
    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center animate-niyet-check-pop">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

// Yorum sayısına göre kademeli, abartısız güven metni
function resultTrustLine(count: number): string {
  if (count >= 20) return `${count} kullanıcının yorumuna göre sıralandı`;
  if (count >= 3)  return `Bu kategoride ${count} gerçek kullanıcı yorumuna göre sıralandı`;
  return "Bu kategoride henüz az yorum var — şimdilik FI·KA·PE puanına göre sıraladık";
}

export function NiyetKarti({ quizAnswers, preCatSlug, categoryReviewCount = 0 }: Props) {
  const router = useRouter();

  const [open,        setOpen]        = useState(false);
  const [step,        setStep]        = useState<0 | 1 | 2>(0);
  const [direction,   setDirection]   = useState<"fwd" | "back">("fwd");
  const [selectedCat, setSelectedCat] = useState<QuizCat | null>(null);
  const [selectedQ2,  setSelectedQ2]  = useState<string | null>(null);
  const [selectedQ3,  setSelectedQ3]  = useState<string | null>(null);

  const preCat = preCatSlug ? (SLUG_TO_CAT[preCatSlug] ?? null) : null;

  const openQuiz = useCallback(() => {
    setSelectedQ2(null);
    setSelectedQ3(null);
    setDirection("fwd");
    if (preCat) {
      setSelectedCat(preCat);
      setStep(1);
    } else {
      setSelectedCat(null);
      setStep(0);
    }
    setOpen(true);
  }, [preCat]);

  const closeQuiz = useCallback(() => {
    setOpen(false);
  }, []);

  const handleBack = useCallback(() => {
    setDirection("back");
    if (step === 2) { setStep(1); setSelectedQ3(null); }
    else            { setStep(0); setSelectedCat(null); setSelectedQ2(null); }
  }, [step]);

  const handleNext = useCallback(() => {
    setDirection("fwd");
    if (step === 0 && selectedCat) setStep(1);
    if (step === 1 && selectedQ2)  setStep(2);
  }, [step, selectedCat, selectedQ2]);

  const handleComplete = useCallback(() => {
    if (!selectedCat || !selectedQ2 || !selectedQ3) return;
    const encoded  = encodeQuiz({ cat: selectedCat, q2: selectedQ2, q3: selectedQ3 });
    const catSlug  = CAT_TO_SLUG[selectedCat];
    const params   = new URLSearchParams();
    if (catSlug) params.set("kategori", catSlug);
    params.set("quiz", encoded);
    router.push(`/?${params.toString()}`);
    setOpen(false);
  }, [router, selectedCat, selectedQ2, selectedQ3]);

  const handleClearQuiz = useCallback(() => {
    if (!quizAnswers) { router.push("/"); return; }
    const catSlug = CAT_TO_SLUG[quizAnswers.cat];
    router.push(catSlug ? `/?kategori=${catSlug}` : "/");
  }, [router, quizAnswers]);

  // ── Result bar ────────────────────────────────────────
  if (quizAnswers && !open) {
    const steps  = QUIZ_STEPS[quizAnswers.cat];
    const q2Opt  = steps[0]?.opts.find((o) => o.key === quizAnswers.q2);
    const q3Opt  = steps[1]?.opts.find((o) => o.key === quizAnswers.q3);
    const q2Label = q2Opt ? `${q2Opt.icon} ${q2Opt.label}` : quizAnswers.q2;
    const q3Label = q3Opt ? `${q3Opt.icon} ${q3Opt.label}` : quizAnswers.q3;

    return (
      <div className="col-span-full bg-white rounded-2xl border border-gray-100 overflow-hidden animate-niyet-result">
        <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--fi-color), var(--ka-color) 55%, var(--pe-color))" }}
          >
            <MatchIcon size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 leading-snug">
              {CAT_LABELS[quizAnswers.cat]} · {resultTrustLine(categoryReviewCount)}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {q2Label} · {q3Label}
            </p>
          </div>
          <button
            onClick={openQuiz}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Değiştir →
          </button>
          <button
            onClick={handleClearQuiz}
            aria-label="Quiz'i kapat"
            className="text-gray-300 hover:text-gray-500 transition-colors text-sm leading-none ml-1"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // ── Closed banner ─────────────────────────────────────
  if (!open) {
    return (
      <div className="col-span-full">
        <button
          onClick={openQuiz}
          className="relative w-full bg-white rounded-2xl border border-gray-200 pl-6 pr-4 py-4 flex items-center gap-3 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all group text-left animate-niyet-enter"
        >
          <div
            className="absolute inset-y-0 left-0 w-1.5"
            style={{ background: "linear-gradient(180deg, var(--fi-color), var(--ka-color), var(--pe-color))" }}
            aria-hidden="true"
          />
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--fi-color), var(--ka-color) 55%, var(--pe-color))" }}
          >
            <MatchIcon />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: "var(--pe-color)" }}>
              3 Soru · 30 Saniye
            </p>
            <p className="text-sm font-bold text-gray-900">3 soruda sana en uygun aracı bulalım</p>
            <p className="text-xs text-gray-500 mt-0.5">FI·KA·PE puanı + gerçek yorumlara göre sıralanır</p>
          </div>
          <span className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all text-xl font-light select-none">
            ›
          </span>
        </button>
      </div>
    );
  }

  // ── Quiz open ─────────────────────────────────────────
  const stepDef   = step > 0 ? QUIZ_STEPS[selectedCat!]?.[step - 1] : null;
  const totalSteps = preCat ? 2 : 3;
  const curIndex   = preCat ? step - 1 : step;          // 0-based progress index
  const canProceed =
    step === 0 ? !!selectedCat :
    step === 1 ? !!selectedQ2  :
                  !!selectedQ3;
  const isLastStep = step === 2;
  const slideClass = direction === "fwd" ? "animate-niyet-slide-right" : "animate-niyet-slide-left";

  return (
    <div className="col-span-full bg-white rounded-2xl border border-gray-900 overflow-hidden">

      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                  i < curIndex ? "bg-white/50" :
                  i === curIndex ? "bg-white" : "bg-white/15"
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-bold text-white leading-snug">
            {step === 0 ? "Ne almayı düşünüyorsun?" : stepDef?.question}
          </p>
          <p className="text-[10px] text-white/50 mt-0.5">
            Adım {curIndex + 1} / {totalSteps}
            {selectedCat && step > 0 && (
              <span className="ml-1.5 text-white/40">· {CAT_LABELS[selectedCat]}</span>
            )}
          </p>
        </div>
        <button
          onClick={closeQuiz}
          className="text-white/30 hover:text-white/60 transition-colors text-sm mt-0.5 shrink-0"
          aria-label="Kapat"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="p-4">

        <div key={step} className={slideClass}>
          {/* Step 0: Category */}
          {step === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {ALL_CATS.map((c, i) => {
                const isSel = selectedCat === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setSelectedCat(c.key)}
                    className={`relative flex flex-col items-start p-4 rounded-xl border-[1.5px] transition-all active:scale-95 text-left ${
                      isSel
                        ? "border-gray-900 bg-white shadow-sm"
                        : "border-transparent hover:border-gray-200"
                    }`}
                    style={!isSel ? { background: TINTS[i % TINTS.length] } : undefined}
                  >
                    {isSel && <CheckBadge />}
                    <span className="text-xl mb-1.5 select-none">{c.icon}</span>
                    <span className="text-sm font-bold text-gray-900">{c.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Steps 1 & 2: branching questions */}
          {step > 0 && stepDef && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {stepDef.opts.map((opt, i) => {
                const current = step === 1 ? selectedQ2 : selectedQ3;
                const setter  = step === 1 ? setSelectedQ2 : setSelectedQ3;
                const isSel   = current === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setter(opt.key)}
                    className={`relative flex flex-col items-start p-4 rounded-xl border-[1.5px] transition-all active:scale-95 text-left ${
                      isSel
                        ? "border-gray-900 bg-white shadow-sm"
                        : "border-transparent hover:border-gray-200"
                    }`}
                    style={!isSel ? { background: TINTS[i % TINTS.length] } : undefined}
                  >
                    {isSel && <CheckBadge />}
                    <span className="text-xl mb-1.5 select-none">{opt.icon}</span>
                    <span className="text-sm font-bold text-gray-900">{opt.label}</span>
                    {opt.sub && (
                      <span className="text-[10px] text-gray-500 mt-0.5">{opt.sub}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={step === 0 ? closeQuiz : handleBack}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            {step === 0 ? "İptal" : "← Geri"}
          </button>
          <button
            onClick={isLastStep ? handleComplete : handleNext}
            disabled={!canProceed}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gray-900 hover:bg-gray-700 transition-colors disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            {isLastStep ? "Bana uyanları göster →" : "Sıradaki soru →"}
          </button>
        </div>
      </div>
    </div>
  );
}
