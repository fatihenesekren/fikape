"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ExpertNoteAnswerView {
  id: number;
  text: string;
  authorName: string;
  createdAt: string;
}

export interface ExpertNoteQuestionView {
  id: number;
  text: string;
  authorName: string;
  authorUserId: number;
  createdAt: string;
  answers: ExpertNoteAnswerView[];
}

// Usta notu altındaki soru-cevap — "B modeli": soruyu herkes sorar (sahiplik
// şartı yok, kendi notuna hariç), cevabı yalnız doğrulanmış ustalar verir
// (API tarafında zorlanır, burada da forma erişim `canAnswer` ile kapalı).
export function ExpertNoteQna({
  noteId,
  questions,
  isLoggedIn,
  canAnswer,
  currentUserId,
}: {
  noteId: number;
  questions: ExpertNoteQuestionView[];
  isLoggedIn: boolean;
  canAnswer: boolean;
  currentUserId: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Hangi sorunun cevap formu açık — aynı anda birden fazla açılabilir.
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerError, setAnswerError] = useState("");
  // Gönderilen (henüz moderasyon bekleyen, bu yüzden listede görünmeyen)
  // cevaplar için soru bazlı bir onay mesajı.
  const [submittedIds, setSubmittedIds] = useState<Set<number>>(new Set());

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 10) return setError("En az 10 karakter yazınız.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/expert-notes/${noteId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        setLoading(false);
        return;
      }
      setText("");
      setLoading(false);
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
      setLoading(false);
    }
  }

  async function answer(e: React.FormEvent, questionId: number) {
    e.preventDefault();
    if (answerText.trim().length < 5) return setAnswerError("En az 5 karakter yazınız.");
    setAnswerLoading(true);
    setAnswerError("");
    try {
      const res = await fetch(`/api/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: answerText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAnswerError(data.error ?? "Bir hata oluştu.");
        setAnswerLoading(false);
        return;
      }
      setAnswerText("");
      setAnsweringId(null);
      setAnswerLoading(false);
      setSubmittedIds((s) => new Set(s).add(questionId));
    } catch {
      setAnswerError("Bağlantı hatası.");
      setAnswerLoading(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1"
      >
        💬 Soru sor {questions.length > 0 ? `(${questions.length})` : ""}
        <span className="text-gray-300">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {questions.map((q) => {
            // Cevap formu yalnız: doğrulanmış usta ise VE kendi sorusu değilse
            // (kendi sorusuna cevap zaten sunucu tarafında da engelli).
            const canAnswerThis = canAnswer && currentUserId != null && q.authorUserId !== currentUserId;
            return (
              <div key={q.id} className="bg-gray-50 rounded-lg px-3 py-2 space-y-2">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{q.authorName}:</span> {q.text}
                </p>
                {q.answers.map((a) => (
                  <p key={a.id} className="text-sm text-gray-600 pl-3 border-l-2 border-gray-200">
                    <span className="font-semibold text-gray-700">{a.authorName}:</span> {a.text}
                  </p>
                ))}
                {q.answers.length === 0 && !submittedIds.has(q.id) && (
                  <p className="text-xs text-gray-400 italic">Henüz cevaplanmadı.</p>
                )}
                {submittedIds.has(q.id) && (
                  <p className="text-xs text-green-700 italic">Cevabınız gönderildi, incelemeye alındı.</p>
                )}

                {canAnswerThis && (
                  answeringId === q.id ? (
                    <form onSubmit={(e) => answer(e, q.id)} className="flex items-start gap-2 pt-1">
                      <input
                        type="text"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value.slice(0, 500))}
                        placeholder="Soruyu cevaplayın…"
                        autoFocus
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                      />
                      <button
                        type="submit"
                        disabled={answerLoading}
                        className="px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 shrink-0"
                        style={{ background: "#111" }}
                      >
                        {answerLoading ? "…" : "Gönder"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAnsweringId(null); setAnswerError(""); }}
                        className="text-xs text-gray-400 hover:text-gray-700 shrink-0 py-2"
                      >
                        Vazgeç
                      </button>
                    </form>
                  ) : (
                    !submittedIds.has(q.id) && (
                      <button
                        type="button"
                        onClick={() => { setAnsweringId(q.id); setAnswerError(""); }}
                        className="text-xs font-semibold text-link hover:underline pt-1"
                      >
                        Cevap ver →
                      </button>
                    )
                  )
                )}
                {answeringId === q.id && answerError && (
                  <p className="text-xs text-red-600">{answerError}</p>
                )}
              </div>
            );
          })}
          {questions.length === 0 && (
            <p className="text-xs text-gray-400">Henüz soru sorulmamış.</p>
          )}

          {isLoggedIn ? (
            <form onSubmit={ask} className="flex items-start gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 300))}
                placeholder={canAnswer ? "Not sahibine bir soru sorun…" : "Bu usta notu hakkında soru sorun…"}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 shrink-0"
                style={{ background: "#111" }}
              >
                {loading ? "…" : "Sor"}
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-400">Soru sormak için giriş yapmalısınız.</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
