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
  text: string;
  displayName: string | null;
  createdAt: string;
  answers: AnswerData[];
}

interface Props {
  productSlug:  string;
  questions:    QuestionData[];
  isLoggedIn:   boolean;
  categorySlug: string;
}

// Kategoriye uygun örnek sorular — her yüklemede havuzdan rastgele biri gösterilir
const QNA_EXAMPLES: Record<string, string[]> = {
  otomobil: [
    "Kışın klima performansı nasıl?",
    "Yakıt tüketimi ilan edilenle uyumlu mu?",
    "LPG'ye dönüşüm yapılabilir mi?",
    "Bakım maliyeti diğer araçlara göre nasıl?",
  ],
  motosiklet: [
    "Kışın günlük kullanıma uygun mu?",
    "Gerçek yakıt tüketimi ne kadar?",
    "Uzun yolda konfor nasıl?",
    "Bakım periyodu ne sıklıkta?",
  ],
  "e-scooter": [
    "Şarj süresi gerçekte ne kadar?",
    "Yağmurda kullanılabiliyor mu?",
    "İlan edilen menzile ne kadar yaklaşıyor?",
    "Azami hızı yeterli mi?",
  ],
  "e-bisiklet": [
    "Pedal desteği yokuşta yeterli mi?",
    "Gerçek menzil kaç km?",
    "Şarj süresi ne kadar?",
    "Ağırlığı taşımayı zorlaştırıyor mu?",
  ],
  karavan: [
    "Kışın izolasyonu yeterli mi?",
    "Elektrik/su bağlantısı pratik mi?",
    "Çekişi zorlanmadan yapılabiliyor mu?",
    "İç hacim günlük kullanım için yeterli mi?",
  ],
  kamyonet: [
    "Yüklüyken yakıt tüketimi nasıl değişiyor?",
    "İlan edilen yük kapasitesi gerçekçi mi?",
    "Off-road yeteneği nasıl?",
    "Bakım maliyeti işletme için uygun mu?",
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

function AnswerForm({ questionId, onDone }: { questionId: number; onDone: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (text.trim().length < 5) { setError("En az 5 karakter yazın."); return; }
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
    <div className="mt-2 space-y-1.5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 500))}
        rows={2}
        placeholder="Bu soruyu cevapla..."
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400 resize-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
        style={{ background: "#111" }}
      >
        {loading ? "Gönderiliyor..." : "Cevapla"}
      </button>
    </div>
  );
}

export function QnaSection({ productSlug, questions, isLoggedIn, categorySlug }: Props) {
  const router = useRouter();
  const [askText, setAskText] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState("");
  const [replyOpenId, setReplyOpenId] = useState<number | null>(null);
  const [example] = useState(() => pickExample(categorySlug));

  async function submitQuestion() {
    setAskError("");
    if (askText.trim().length < 10) { setAskError("En az 10 karakter yazın."); return; }
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
    <div className="divide-y divide-gray-50">
      <div className="px-5 py-4 space-y-2">
        <p className="text-sm font-semibold text-gray-800">Bu araç hakkında bir sorun mu var?</p>
        {isLoggedIn ? (
          <>
            <textarea
              value={askText}
              onChange={(e) => setAskText(e.target.value.slice(0, 300))}
              rows={2}
              placeholder={`Örn: ${example}`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 resize-none"
            />
            {askError && <p className="text-xs text-red-500">{askError}</p>}
            <button
              type="button"
              onClick={submitQuestion}
              disabled={askLoading}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#111" }}
            >
              {askLoading ? "Gönderiliyor..." : "Soru Sor"}
            </button>
            <p className="text-xs text-gray-400">Sorun, bu aracı kullanan yorumculara bildirilir.</p>
          </>
        ) : (
          <p className="text-sm text-gray-400">Soru sormak için giriş yapmalısın.</p>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="p-10 text-center space-y-2">
          <div className="text-3xl">❓</div>
          <p className="font-semibold text-gray-800">Henüz soru sorulmamış</p>
          <p className="text-sm text-gray-400">İlk soruyu sen sor.</p>
        </div>
      ) : (
        questions.map((q) => (
          <div key={q.id} className="px-5 py-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-gray-900">{q.text}</p>
              <span className="text-xs text-gray-400 shrink-0">{fmtDate(q.createdAt)}</span>
            </div>
            <p className="text-xs text-gray-400">{q.displayName ?? "Anonim kullanıcı"} sordu</p>

            {q.answers.length > 0 && (
              <div className="mt-2 space-y-2 pl-3 border-l-2 border-gray-100">
                {q.answers.map((a) => (
                  <div key={a.id}>
                    <p className="text-sm text-gray-700">{a.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.displayName ?? "Anonim kullanıcı"} · {fmtDate(a.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {isLoggedIn && (
              replyOpenId === q.id ? (
                <AnswerForm questionId={q.id} onDone={() => { setReplyOpenId(null); router.refresh(); }} />
              ) : (
                <button
                  type="button"
                  onClick={() => setReplyOpenId(q.id)}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
                >
                  ✎ Cevapla
                </button>
              )
            )}
          </div>
        ))
      )}
    </div>
  );
}
