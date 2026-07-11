"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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

// Kapalı banner'da dönüşümlü niyet soruları — ilk eleman varsayılan etiket,
// prefers-reduced-motion açıkken döngü hiç başlamaz ve bu sabit kalır.
const BANNER_PHRASES = [
  "4 Soru · 30 Saniye",
  "Yeni bir araç mı almayı düşünüyorsun?",
  "Şehir içi mi, uzun yol mu?",
  "Elektrikliye geçmeyi mi düşünüyorsun?",
];

// Seçim yapılınca otomatik ilerleme gecikmesi — check-pop animasyonu görünsün diye
const AUTO_ADVANCE_MS = 350;

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
  const [step,        setStep]        = useState<0 | 1 | 2 | 3>(0);
  const [direction,   setDirection]   = useState<"fwd" | "back">("fwd");
  const [selectedCat, setSelectedCat] = useState<QuizCat | null>(null);
  const [selectedQ2,  setSelectedQ2]  = useState<string | null>(null);
  const [selectedQ3,  setSelectedQ3]  = useState<string | null>(null);
  const [selectedQ4,  setSelectedQ4]  = useState<string | null>(null);

  // Dönüşümlü banner metni
  const [phraseIdx,     setPhraseIdx]     = useState(0);
  const [phraseVisible, setPhraseVisible] = useState(true);

  // Otomatik ilerleme zamanlayıcısı — geri/kapat/yeni seçimde iptal edilmeli,
  // yoksa geri dönen kullanıcı istemeden ileri fırlatılır
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimer.current) { clearTimeout(advanceTimer.current); advanceTimer.current = null; }
  }, []);
  useEffect(() => clearAdvanceTimer, [clearAdvanceTimer]);

  const preCat = preCatSlug ? (SLUG_TO_CAT[preCatSlug] ?? null) : null;
  const showBanner = !quizAnswers && !open;

  useEffect(() => {
    if (!showBanner) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      setPhraseVisible(false);
      setTimeout(() => {
        setPhraseIdx((i) => (i + 1) % BANNER_PHRASES.length);
        setPhraseVisible(true);
      }, 450);
    }, 3500);
    return () => clearInterval(interval);
  }, [showBanner]);

  const openQuiz = useCallback(() => {
    setSelectedQ2(null);
    setSelectedQ3(null);
    setSelectedQ4(null);
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
    clearAdvanceTimer();
    setOpen(false);
  }, [clearAdvanceTimer]);

  const handleBack = useCallback(() => {
    clearAdvanceTimer();
    setDirection("back");
    if      (step === 3) { setStep(2); setSelectedQ4(null); }
    else if (step === 2) { setStep(1); setSelectedQ3(null); }
    else                 { setStep(0); setSelectedCat(null); setSelectedQ2(null); }
  }, [step, clearAdvanceTimer]);

  const completeWith = useCallback((q4: string) => {
    if (!selectedCat || !selectedQ2 || !selectedQ3) return;
    const encoded  = encodeQuiz({ cat: selectedCat, q2: selectedQ2, q3: selectedQ3, q4 });
    const catSlug  = CAT_TO_SLUG[selectedCat];
    const params   = new URLSearchParams();
    if (catSlug) params.set("kategori", catSlug);
    params.set("quiz", encoded);
    router.push(`/?${params.toString()}`);
    setOpen(false);
  }, [router, selectedCat, selectedQ2, selectedQ3]);

  // Seçim → kısa gecikmeyle otomatik ilerleme; son soruda doğrudan sonuç
  const selectCat = useCallback((key: QuizCat) => {
    setSelectedCat(key);
    clearAdvanceTimer();
    advanceTimer.current = setTimeout(() => { setDirection("fwd"); setStep(1); }, AUTO_ADVANCE_MS);
  }, [clearAdvanceTimer]);

  const selectAnswer = useCallback((key: string) => {
    const setter = step === 1 ? setSelectedQ2 : step === 2 ? setSelectedQ3 : setSelectedQ4;
    setter(key);
    clearAdvanceTimer();
    advanceTimer.current = setTimeout(() => {
      if (step === 3) { completeWith(key); return; }
      setDirection("fwd");
      setStep((s) => (s + 1) as 1 | 2 | 3);
    }, AUTO_ADVANCE_MS);
  }, [step, clearAdvanceTimer, completeWith]);

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
    const q4Opt  = steps[2]?.opts.find((o) => o.key === quizAnswers.q4);
    const q2Label = q2Opt ? `${q2Opt.icon} ${q2Opt.label}` : quizAnswers.q2;
    const q3Label = q3Opt ? `${q3Opt.icon} ${q3Opt.label}` : quizAnswers.q3;
    const q4Label = q4Opt ? `${q4Opt.icon} ${q4Opt.label}` : null;

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
              {q2Label} · {q3Label}{q4Label ? <> · {q4Label}</> : null}
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
          className="relative w-full bg-white rounded-2xl border border-gray-200 pl-6 pr-4 py-6 flex items-center gap-3 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all group text-left animate-niyet-enter"
        >
          <div
            className="absolute inset-y-0 left-0 w-1.5"
            style={{ background: "linear-gradient(180deg, var(--fi-color), var(--ka-color), var(--pe-color))" }}
            aria-hidden="true"
          />
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--fi-color), var(--ka-color) 55%, var(--pe-color))" }}
          >
            <MatchIcon size={24} />
          </div>
          <div className="flex-1 min-w-0">
            {/* Sabit yükseklik: metin değişirken banner zıplamasın */}
            <div className="h-4 mb-0.5 overflow-hidden">
              <p
                className={`text-[11px] font-bold tracking-wide truncate transition-all duration-[450ms] ease-out ${
                  phraseVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                }`}
                style={{ color: "var(--pe-color)" }}
                aria-hidden={phraseIdx !== 0}
              >
                {BANNER_PHRASES[phraseIdx]}
              </p>
            </div>
            <p className="text-sm font-bold text-gray-900">4 soruda sana en uygun aracı bulalım</p>
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
  const totalSteps = preCat ? 3 : 4;
  const curIndex   = preCat ? step - 1 : step;          // 0-based progress index
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
                    onClick={() => selectCat(c.key)}
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

          {/* Steps 1-3: branching questions */}
          {step > 0 && stepDef && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {stepDef.opts.map((opt, i) => {
                const current = step === 1 ? selectedQ2 : step === 2 ? selectedQ3 : selectedQ4;
                const isSel   = current === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => selectAnswer(opt.key)}
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

        {/* Navigation — ileri butonu yok: seçim otomatik ilerletir, son soruda sonuca geçer */}
        <div className="flex items-center justify-between">
          <button
            onClick={step === 0 ? closeQuiz : handleBack}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            {step === 0 ? "İptal" : "← Geri"}
          </button>
          <span className="text-[10px] text-gray-300 select-none">
            {step === 3 ? "Seçince sonuçlar gelir" : "Seçince otomatik ilerler"}
          </span>
        </div>
      </div>
    </div>
  );
}
