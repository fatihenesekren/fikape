"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ALL_CATS, QUIZ_STEPS, CAT_LABELS, CAT_TO_SLUG, SLUG_TO_CAT,
  encodeQuiz,
  type QuizAnswers, type QuizCat,
} from "@/lib/quiz";

interface Props {
  quizAnswers: QuizAnswers | null;
  preCatSlug:  string | null;
}

export function NiyetKarti({ quizAnswers, preCatSlug }: Props) {
  const router = useRouter();

  const [open,        setOpen]        = useState(false);
  const [step,        setStep]        = useState<0 | 1 | 2>(0);
  const [selectedCat, setSelectedCat] = useState<QuizCat | null>(null);
  const [selectedQ2,  setSelectedQ2]  = useState<string | null>(null);
  const [selectedQ3,  setSelectedQ3]  = useState<string | null>(null);

  const preCat = preCatSlug ? (SLUG_TO_CAT[preCatSlug] ?? null) : null;

  const openQuiz = useCallback(() => {
    setSelectedQ2(null);
    setSelectedQ3(null);
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
    if (step === 2) { setStep(1); setSelectedQ3(null); }
    else            { setStep(0); setSelectedCat(null); setSelectedQ2(null); }
  }, [step]);

  const handleNext = useCallback(() => {
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
      <div className="col-span-full bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm">🎯</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 leading-snug">
              {CAT_LABELS[quizAnswers.cat]} · kişisel eşleşmeye göre sıralandı
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
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
          className="w-full bg-white rounded-2xl border border-dashed border-gray-200 px-4 py-3.5 flex items-center gap-3 hover:border-gray-300 transition-colors group text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 text-base select-none">
            🎯
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">Hangi araç sana göre?</p>
            <p className="text-xs text-gray-400 mt-0.5">3 soruyla kişisel eşleşme</p>
          </div>
          <span className="text-gray-300 group-hover:text-gray-500 transition-colors text-xl font-light select-none">
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
          <p className="text-[10px] text-white/40 mt-0.5">
            Adım {curIndex + 1} / {totalSteps}
            {selectedCat && step > 0 && (
              <span className="ml-1.5 text-white/30">· {CAT_LABELS[selectedCat]}</span>
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

        {/* Step 0: Category */}
        {step === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
            {ALL_CATS.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCat(c.key)}
                className={`flex flex-col items-start p-3 rounded-xl border-[1.5px] transition-all text-left ${
                  selectedCat === c.key
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <span className="text-xl mb-1.5 select-none">{c.icon}</span>
                <span className="text-xs font-bold text-gray-900">{c.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Steps 1 & 2: branching questions */}
        {step > 0 && stepDef && (
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {stepDef.opts.map((opt) => {
              const current = step === 1 ? selectedQ2 : selectedQ3;
              const setter  = step === 1 ? setSelectedQ2 : setSelectedQ3;
              return (
                <button
                  key={opt.key}
                  onClick={() => setter(opt.key)}
                  className={`flex flex-col items-start p-3 rounded-xl border-[1.5px] transition-all text-left ${
                    current === opt.key
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <span className="text-xl mb-1.5 select-none">{opt.icon}</span>
                  <span className="text-xs font-bold text-gray-900">{opt.label}</span>
                  {opt.sub && (
                    <span className="text-[10px] text-gray-400 mt-0.5">{opt.sub}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

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
            {isLastStep ? "Sonuçları Gör →" : "Devam →"}
          </button>
        </div>
      </div>
    </div>
  );
}
