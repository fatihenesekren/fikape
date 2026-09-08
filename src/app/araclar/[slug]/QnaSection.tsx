"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AnswerData {
  id: number;
  text: string;
  displayName: string | null;
  createdAt: string;
}

interface QuestionData {
  id: number;
  userId: number;
  text: string;
  displayName: string | null;
  createdAt: string;
  answers: AnswerData[];
}

interface Props {
  productSlug:   string;
  questions:     QuestionData[];
  isLoggedIn:    boolean;
  currentUserId: number | null;
  canAnswer:     boolean;
  categorySlug:  string;
}

// Kategoriye uygun örnek sorular — her yüklemede havuzdan rastgele biri gösterilir
const QNA_EXAMPLES: Record<string, string[]> = {
  otomobil: [
    "Kalorifer/ısıtma kışın yeterli mi?",
    "Şehir içi gerçek yakıt tüketimi kaç litre?",
    "LPG'ye dönüşüm yapılabilir mi?",
    "Yedek parça bulmak kolay mı?",
    "2. elde değer kaybı çok mu?",
  ],
  motosiklet: [
    "Kışın günlük kullanıma uygun mu?",
    "Gerçek yakıt tüketimi ne kadar?",
    "Uzun yolda konfor nasıl?",
    "Yedek parça/servis kolay bulunuyor mu?",
    "İlk motosiklet için uygun mu?",
  ],
  "e-scooter": [
    "Şarj süresi gerçekte ne kadar?",
    "Yağmurda kullanılabiliyor mu?",
    "İlan edilen menzile ne kadar yaklaşıyor?",
    "Yokuşta güç yetiyor mu?",
    "Katlanabilir mi, taşıması kolay mı?",
  ],
  "e-bisiklet": [
    "Pedal desteği yokuşta yeterli mi?",
    "Gerçek menzil kaç km?",
    "Şarj süresi ne kadar?",
    "Motor gücü şehir içi için yeterli mi?",
    "Yedek pil bulmak kolay mı?",
  ],
  karavan: [
    "Kışın izolasyonu/su tesisatı donuyor mu?",
    "Elektrik/su bağlantısı pratik mi?",
    "Hangi araçla çekilebiliyor, çeki kapasitesi ne?",
    "İç hacim günlük kullanım için yeterli mi?",
    "Muayeneden geçmesi zor mu?",
  ],
  kamyonet: [
    "Yüklüyken yakıt tüketimi nasıl değişiyor?",
    "İlan edilen yük kapasitesi gerçekçi mi?",
    "Kasa paslanmaya dayanıklı mı?",
    "Off-road yeteneği nasıl?",
    "Çift kabin günlük kullanım için pratik mi?",
  ],
};

const DEFAULT_EXAMPLES = QNA_EXAMPLES.otomobil;

function pickExample(categorySlug: string): string {
  const pool = QNA_EXAMPLES[categorySlug] ?? DEFAULT_EXAMPLES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

function initial(name: string | null) {
  const ch = name?.trim()?.[0];
  return ch ? ch.toLocaleUpperCase("tr-TR") : "?";
}

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AnswerForm({ questionId, onDone }: { questionId: number; onDone: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (text.trim().length < 5) { setError("En az 5 karakter yazınız."); return; }
    setLoading(true);
    const res = await fetch(`/api/questions/${questionId}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Bir hata oluştu."); return; }
    setText("");
    onDone();
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 500))}
        rows={2}
        placeholder="Bu soruyu deneyiminize göre cevaplayın…"
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-link focus:ring-2 focus:ring-link-soft resize-none transition-colors"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">{text.length}/500</span>
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: "#111" }}
        >
          {loading ? "Gönderiliyor…" : "Cevabı gönder"}
        </button>
      </div>
    </div>
  );
}

export function QnaSection({ productSlug, questions, isLoggedIn, currentUserId, canAnswer, categorySlug }: Props) {
  const router = useRouter();
  const [askText, setAskText] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState("");
  const [replyOpenId, setReplyOpenId] = useState<number | null>(null);
  const [example] = useState(() => pickExample(categorySlug));

  const answeredCount = questions.filter((q) => q.answers.length > 0).length;

  async function submitQuestion() {
    setAskError("");
    if (askText.trim().length < 10) { setAskError("En az 10 karakter yazınız."); return; }
    setAskLoading(true);
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug, text: askText }),
    });
    const data = await res.json();
    setAskLoading(false);
    if (!res.ok) { setAskError(data.error ?? "Bir hata oluştu."); return; }
    setAskText("");
    router.refresh();
  }

  return (
    <div className="px-5 py-5 space-y-5">
      {/* Soru sorma kartı */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex w-9 h-9 shrink-0 rounded-full bg-link-soft text-link items-center justify-center">
            <BellIcon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Bu araç hakkında soru sorun</p>

            {isLoggedIn ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={askText}
                  onChange={(e) => setAskText(e.target.value.slice(0, 300))}
                  rows={2}
                  placeholder={`Örn: ${example}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-link focus:ring-2 focus:ring-link-soft resize-none transition-colors"
                />
                {askError && <p className="text-xs text-red-500">{askError}</p>}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                    <BellIcon className="w-3.5 h-3.5 shrink-0 text-link" />
                    Soru sorun, bu aracı kullanan yorumculara bildirilsin.
                  </span>
                  <button
                    type="button"
                    onClick={submitQuestion}
                    disabled={askLoading}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 shrink-0"
                    style={{ background: "#111" }}
                  >
                    {askLoading ? "Gönderiliyor…" : "Soru Sor"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Soru sormak için giriş yapmalısınız.</p>
            )}
          </div>
        </div>
      </div>

      {/* Soru listesi */}
      {questions.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-link-soft text-link flex items-center justify-center text-xl font-bold">
            ?
          </div>
          <p className="font-semibold text-gray-800">Henüz soru sorulmamış</p>
          <p className="text-sm text-gray-400">İlk soruyu siz sorun.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <span>{questions.length} soru</span>
            {answeredCount > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <span>{answeredCount} yanıtlanmış</span>
              </>
            )}
          </div>

          {questions.map((q) => (
            <div key={q.id} className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">
                  {initial(q.displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{q.text}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {q.displayName ?? "Anonim kullanıcı"} · {fmtDate(q.createdAt)}
                  </p>
                </div>
              </div>

              {q.answers.length > 0 && (
                <div className="mt-3 ml-11 space-y-3">
                  {q.answers.map((a) => (
                    <div key={a.id} className="rounded-xl bg-gray-50 px-3.5 py-2.5">
                      <p className="text-sm text-gray-700 leading-snug">{a.text}</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {a.displayName ?? "Anonim kullanıcı"} · {fmtDate(a.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {isLoggedIn && canAnswer && currentUserId !== q.userId && (
                <div className="ml-11">
                  {replyOpenId === q.id ? (
                    <AnswerForm questionId={q.id} onDone={() => { setReplyOpenId(null); router.refresh(); }} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReplyOpenId(q.id)}
                      className="mt-2 text-xs font-semibold text-link hover:text-link-deep transition-colors"
                    >
                      ✎ Bu soruyu cevapla
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
