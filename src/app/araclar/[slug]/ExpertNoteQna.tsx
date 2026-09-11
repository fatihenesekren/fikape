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
  createdAt: string;
  answers: ExpertNoteAnswerView[];
}

// Usta notu altındaki soru-cevap — "B modeli": soruyu herkes sorar, cevabı
// yalnız doğrulanmış ustalar verir (API tarafında zorlanır). Kapalı/açık
// olarak başlar, uzun yer kaplamasın diye (bkz. plan §6).
export function ExpertNoteQna({
  noteId,
  questions,
  isLoggedIn,
  canAnswer,
}: {
  noteId: number;
  questions: ExpertNoteQuestionView[];
  isLoggedIn: boolean;
  canAnswer: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          {questions.map((q) => (
            <div key={q.id} className="bg-gray-50 rounded-lg px-3 py-2 space-y-2">
              <p className="text-sm text-gray-800">
                <span className="font-semibold">{q.authorName}:</span> {q.text}
              </p>
              {q.answers.map((a) => (
                <p key={a.id} className="text-sm text-gray-600 pl-3 border-l-2 border-gray-200">
                  <span className="font-semibold text-gray-700">{a.authorName}:</span> {a.text}
                </p>
              ))}
              {q.answers.length === 0 && (
                <p className="text-xs text-gray-400 italic">Henüz cevaplanmadı.</p>
              )}
            </div>
          ))}
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
