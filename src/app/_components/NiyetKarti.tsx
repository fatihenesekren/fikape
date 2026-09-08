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
// "4 Soru · 10 Saniye" artık ayrı bir rozet olduğu için burada tekrar edilmiyor;
// eyebrow tamamen "niyet sorusu" cümlelerine ayrıldı.
const BANNER_PHRASES = [
  "Yeni bir araç mı almayı düşünüyorsun?",
  "Şehir içi mi, uzun yol mu?",
  "Elektrikliye geçmeyi mi düşünüyorsun?",
  "Bütçene en uygun seçim hangisi?",
];

// Seçim yapılınca otomatik ilerleme gecikmesi — check-pop animasyonu görünsün diye
const AUTO_ADVANCE_MS = 350;

// Bir adımın seçili cevabının "🏙️ Şehir içi" biçimli etiketi (özet çipleri için).
function answerLabel(cat: QuizCat, stepIdx: 0 | 1 | 2, key: string | null): string | null {
  if (!key) return null;
  const opt = QUIZ_STEPS[cat]?.[stepIdx]?.opts.find((o) => o.key === key);
  return opt ? `${opt.icon} ${opt.label}` : key;
}

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

// Özet çipi — seçili bir cevabı tikli gösterir, tıklayınca o adıma döner.
function SelectedChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full bg-gray-900 text-white text-[11px] font-semibold pl-1.5 pr-2.5 py-1 hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1"
    >
      <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center shrink-0" aria-hidden="true">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {label}
    </button>
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

  // Quiz'i aç. Mevcut bir sonuç varsa (Değiştir) TÜM cevaplar yüklenir ve
  // istenen adıma gidilir — kullanıcı 4 seçimini tikli görüp istediğini
  // değiştirebilir, baştan doldurmak zorunda kalmaz.
  const openQuiz = useCallback((atStep?: 0 | 1 | 2 | 3) => {
    setDirection("fwd");
    if (quizAnswers) {
      setSelectedCat(quizAnswers.cat);
      setSelectedQ2(quizAnswers.q2);
      setSelectedQ3(quizAnswers.q3);
      setSelectedQ4(quizAnswers.q4);
      setStep(atStep ?? 1);
    } else if (preCat) {
      setSelectedCat(preCat);
      setSelectedQ2(null); setSelectedQ3(null); setSelectedQ4(null);
      setStep(atStep ?? 1);
    } else {
      setSelectedCat(null);
      setSelectedQ2(null); setSelectedQ3(null); setSelectedQ4(null);
      setStep(atStep ?? 0);
    }
    setOpen(true);
  }, [quizAnswers, preCat]);

  const closeQuiz = useCallback(() => {
    clearAdvanceTimer();
    setOpen(false);
  }, [clearAdvanceTimer]);

  // Geri = sadece adım değiştir; seçimler KORUNUR (tikli kalır, değiştirilebilir).
  // Alt cevaplar yalnızca kategori değişince sıfırlanır (bkz. selectCat).
  const handleBack = useCallback(() => {
    clearAdvanceTimer();
    setDirection("back");
    setStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2 | 3) : 0));
  }, [clearAdvanceTimer]);

  // Herhangi bir adıma atla (özet çipleri).
  const goToStep = useCallback((n: 0 | 1 | 2 | 3) => {
    clearAdvanceTimer();
    setDirection(n < step ? "back" : "fwd");
    setStep(n);
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

  // Kategori seçimi — DEĞİŞİRSE alt cevaplar geçersizleşir (farklı dal), sıfırlanır.
  const selectCat = useCallback((key: QuizCat) => {
    if (key !== selectedCat) {
      setSelectedQ2(null); setSelectedQ3(null); setSelectedQ4(null);
    }
    setSelectedCat(key);
    clearAdvanceTimer();
    advanceTimer.current = setTimeout(() => { setDirection("fwd"); setStep(1); }, AUTO_ADVANCE_MS);
  }, [selectedCat, clearAdvanceTimer]);

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
    // Quiz'i kapatmak = ana sayfanın kürasyonlu görünümüne dön. Katalog artık
    // /araclar'da (bkz. backlog_anasayfa_katalog_ayirma) — eski `/?kategori=X`
    // varyantı oraya yönlendiği için "kapat" kullanıcıyı ana sayfadan atıyordu.
    router.push("/");
  }, [router]);

  // ── Result bar ────────────────────────────────────────
  if (quizAnswers && !open) {
    const q2Label = answerLabel(quizAnswers.cat, 0, quizAnswers.q2);
    const q3Label = answerLabel(quizAnswers.cat, 1, quizAnswers.q3);
    const q4Label = answerLabel(quizAnswers.cat, 2, quizAnswers.q4);
    const chips: { label: string; step: 1 | 2 | 3 }[] = [];
    if (q2Label) chips.push({ label: q2Label, step: 1 });
    if (q3Label) chips.push({ label: q3Label, step: 2 });
    if (q4Label) chips.push({ label: q4Label, step: 3 });

    return (
      <div className="col-span-full bg-white rounded-2xl border border-gray-100 overflow-hidden animate-niyet-result">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, var(--fi-color), var(--ka-color) 55%, var(--pe-color))" }}
            >
              <MatchIcon size={14} />
            </div>
            <p className="flex-1 min-w-0 text-xs font-semibold text-gray-900 leading-snug">
              {CAT_LABELS[quizAnswers.cat]} · {resultTrustLine(categoryReviewCount)}
            </p>
            <button
              onClick={() => openQuiz(1)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors shrink-0"
            >
              Değiştir →
            </button>
            <button
              onClick={handleClearQuiz}
              aria-label="Filtreyi kaldır"
              className="text-gray-300 hover:text-gray-500 transition-colors text-sm leading-none shrink-0"
            >
              ✕
            </button>
          </div>
          {/* Aktif filtreler — tikli, tıklayınca o soruya döner */}
          <div className="flex flex-wrap gap-1.5 mt-2 pl-10">
            {chips.map((c) => (
              <SelectedChip key={c.step} label={c.label} onClick={() => openQuiz(c.step)} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Closed banner ─────────────────────────────────────
  if (!open) {
    return (
      <div className="col-span-full">
        <button
          onClick={() => openQuiz()}
          aria-label="4 soruda sana en uygun aracı bulalım — başla"
          className="relative w-full bg-white rounded-2xl border border-gray-200 p-5 sm:pl-7 sm:pr-7 sm:py-7 flex flex-col sm:flex-row sm:items-center gap-4 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all group text-left animate-niyet-enter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
        >
          <div
            className="absolute inset-y-0 left-0 w-2"
            style={{ background: "linear-gradient(180deg, var(--fi-color), var(--ka-color), var(--pe-color))" }}
            aria-hidden="true"
          />

          {/* İkon + metin — mobilde tek satır grup, masaüstünde doğrudan flex çocuğu */}
          <div className="flex items-center gap-4 sm:contents">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 animate-niyet-icon-pulse"
              style={{ background: "linear-gradient(135deg, var(--fi-color), var(--ka-color) 55%, var(--pe-color))" }}
            >
              <MatchIcon size={30} />
            </div>
            <div className="flex-1 min-w-0">
              {/* Sabit yükseklik: metin değişirken banner zıplamasın */}
              <div className="h-4 mb-0.5 overflow-hidden">
                <p
                  aria-hidden="true"
                  className={`text-[11px] font-bold tracking-wide truncate transition-all duration-[450ms] ease-out ${
                    phraseVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                  }`}
                  style={{ color: "var(--pe-color)" }}
                >
                  {BANNER_PHRASES[phraseIdx]}
                </p>
              </div>
              <p className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                4 soruda sana en uygun aracı bulalım
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                FI·KA·PE puanı + gerçek yorumlara göre sıralanır
              </p>
            </div>
          </div>

          {/* Sağ blok — süre rozeti + görünür CTA, birlikte bir birim.
              Rozet artık absolute değil; butonun hemen üstünde duruyor. */}
          <div className="shrink-0 w-full sm:w-auto flex flex-col gap-2 items-stretch sm:items-end">
            <span
              className="self-start sm:self-auto inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "var(--pe-bg)", color: "var(--pe-color)" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
              </svg>
              4 soru · 10 saniye
            </span>
            {/* Kartın kendisi buton olduğu için bu bir <span>, gerçek buton değil */}
            <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 group-hover:bg-gray-700 transition-colors">
              Hadi başlayalım
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                className="animate-niyet-arrow-nudge"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </button>
      </div>
    );
  }

  // ── Quiz open ─────────────────────────────────────────
  const stepDef    = step > 0 ? QUIZ_STEPS[selectedCat!]?.[step - 1] : null;
  const totalSteps = preCat ? 3 : 4;
  const curIndex   = preCat ? step - 1 : step;          // 0-based progress index
  const slideClass = direction === "fwd" ? "animate-niyet-slide-right" : "animate-niyet-slide-left";

  // Açık quiz içindeki özet çipleri — cevabı olan her adım, mevcut adım hariç.
  const summaryChips: { label: string; step: 0 | 1 | 2 | 3 }[] = [];
  if (selectedCat && step !== 0 && !preCat) {
    summaryChips.push({ label: CAT_LABELS[selectedCat], step: 0 });
  }
  if (selectedCat) {
    const l2 = answerLabel(selectedCat, 0, selectedQ2);
    const l3 = answerLabel(selectedCat, 1, selectedQ3);
    const l4 = answerLabel(selectedCat, 2, selectedQ4);
    if (l2 && step !== 1) summaryChips.push({ label: l2, step: 1 });
    if (l3 && step !== 2) summaryChips.push({ label: l3, step: 2 });
    if (l4 && step !== 3) summaryChips.push({ label: l4, step: 3 });
  }

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

        {/* Şu ana kadar seçilenler — tıklayınca o adıma döner */}
        {summaryChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {summaryChips.map((c) => (
              <SelectedChip key={c.step} label={c.label} onClick={() => goToStep(c.step)} />
            ))}
          </div>
        )}

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
                    className={`relative flex flex-col items-start p-4 rounded-xl border-[1.5px] transition-all active:scale-95 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1 ${
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
                    className={`relative flex flex-col items-start p-4 rounded-xl border-[1.5px] transition-all active:scale-95 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1 ${
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
