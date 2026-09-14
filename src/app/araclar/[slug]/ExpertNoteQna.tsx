"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hhmm } from "@/lib/messageTime";

export interface ExpertNoteAnswerView {
  id: number;
  text: string;
  authorName: string;
  authorUserId: number;
  status: "PENDING" | "PUBLISHED" | "REJECTED";
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

// "14 Eyl · 14:32" — kullanıcı fark etti, soru/cevap satırlarında hiç
// tarih/saat yoktu.
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  return `${datePart} · ${hhmm(d)}`;
}

const ANSWER_STATUS_LABEL: Record<string, string> = {
  PENDING: "İnceleniyor",
  REJECTED: "Reddedildi",
};

// Usta notu altındaki soru-cevap — "B modeli": soruyu herkes sorar (sahiplik
// şartı yok, kendi notuna hariç). Kullanıcı kararı (14 Eylül 2026): bir
// soruya toplamda TEK cevap yeterli — bir usta cevapladıktan sonra başka
// birine "Cevap ver" gösterilmez, yalnız cevaplayan kendi cevabını
// düzenleyebilir/silebilir. (Önceki tasarım — birden çok ustanın aynı soruya
// ayrı ayrı cevap vermesi — kullanıcı isteğiyle basitleştirildi.)
export function ExpertNoteQna({
  noteId,
  questions,
  isLoggedIn,
  canAnswer,
  currentUserId,
  noteAuthorUserId,
}: {
  noteId: number;
  questions: ExpertNoteQuestionView[];
  isLoggedIn: boolean;
  canAnswer: boolean;
  currentUserId: number | null;
  noteAuthorUserId: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isOwnNote = currentUserId != null && currentUserId === noteAuthorUserId;

  // Hangi sorunun cevap formu açık (yeni cevap YA DA düzenleme) — aynı anda
  // birden fazla açılabilir. mode ayrımı submit davranışını belirler.
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerError, setAnswerError] = useState("");
  const [deletingAnswerId, setDeletingAnswerId] = useState<number | null>(null);
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

  async function submitAnswer(e: React.FormEvent, questionId: number) {
    e.preventDefault();
    if (answerText.trim().length < 5) return setAnswerError("En az 5 karakter yazınız.");
    setAnswerLoading(true);
    setAnswerError("");
    try {
      const url = editingAnswerId != null ? `/api/answers/${editingAnswerId}` : `/api/questions/${questionId}/answers`;
      const res = await fetch(url, {
        method: editingAnswerId != null ? "PATCH" : "POST",
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
      setEditingAnswerId(null);
      setAnswerLoading(false);
      setSubmittedIds((s) => new Set(s).add(questionId));
      router.refresh();
    } catch {
      setAnswerError("Bağlantı hatası.");
      setAnswerLoading(false);
    }
  }

  async function deleteAnswer(answerId: number) {
    if (!confirm("Bu cevabı silmek istediğinize emin misiniz?")) return;
    setDeletingAnswerId(answerId);
    try {
      const res = await fetch(`/api/answers/${answerId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Silinemedi.");
      }
    } finally {
      setDeletingAnswerId(null);
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
            const myAnswer = currentUserId != null ? q.answers.find((a) => a.authorUserId === currentUserId) : undefined;
            // Kullanıcı kararı: bir soruya toplamda tek cevap — biri
            // (herhangi bir usta) zaten cevaplamışsa başkasına "Cevap ver"
            // gösterilmez, yalnız cevaplayan kendi cevabını yönetebilir.
            const canAnswerThis = canAnswer && currentUserId != null && q.authorUserId !== currentUserId
              && q.answers.length === 0;
            const isEditingMyAnswer = myAnswer != null && editingAnswerId === myAnswer.id;

            return (
              <div key={q.id} className="bg-gray-50 rounded-lg px-3 py-2 space-y-2">
                <div>
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{q.authorName}:</span> {q.text}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(q.createdAt)}</p>
                </div>

                {q.answers.map((a) => (
                  <div key={a.id} className="pl-3 border-l-2 border-gray-200">
                    {isEditingMyAnswer && a.id === myAnswer!.id ? (
                      <form onSubmit={(e) => submitAnswer(e, q.id)} className="flex items-start gap-2">
                        <input
                          type="text"
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value.slice(0, 500))}
                          autoFocus
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                        />
                        <button
                          type="submit"
                          disabled={answerLoading}
                          className="px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 shrink-0"
                          style={{ background: "var(--btn-dark)" }}
                        >
                          {answerLoading ? "…" : "Kaydet"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingAnswerId(null); setAnswerError(""); }}
                          className="text-xs text-gray-400 hover:text-gray-700 shrink-0 py-2"
                        >
                          Vazgeç
                        </button>
                      </form>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">{a.authorName}:</span> {a.text}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-gray-400">{formatDateTime(a.createdAt)}</span>
                          {a.status !== "PUBLISHED" && (
                            <span className="text-[10px] font-semibold text-amber-600">· {ANSWER_STATUS_LABEL[a.status]}</span>
                          )}
                          {a.authorUserId === currentUserId && (
                            <>
                              <button
                                type="button"
                                onClick={() => { setEditingAnswerId(a.id); setAnswerText(a.text); setAnswerError(""); }}
                                className="text-[10px] font-semibold text-link hover:underline"
                              >
                                Düzenle
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteAnswer(a.id)}
                                disabled={deletingAnswerId === a.id}
                                className="text-[10px] font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
                              >
                                {deletingAnswerId === a.id ? "Siliniyor…" : "Sil"}
                              </button>
                            </>
                          )}
                        </div>
                        {isEditingMyAnswer && answerError && <p className="text-xs text-red-600 mt-1">{answerError}</p>}
                      </>
                    )}
                  </div>
                ))}
                {q.answers.length === 0 && !submittedIds.has(q.id) && (
                  <p className="text-xs text-gray-400 italic">Henüz cevaplanmadı.</p>
                )}
                {submittedIds.has(q.id) && !myAnswer && (
                  <p className="text-xs text-green-700 italic">Cevabınız gönderildi, incelemeye alındı.</p>
                )}

                {canAnswerThis && (
                  answeringId === q.id ? (
                    <form onSubmit={(e) => submitAnswer(e, q.id)} className="flex items-start gap-2 pt-1">
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
                        style={{ background: "var(--btn-dark)" }}
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
                        onClick={() => { setAnsweringId(q.id); setAnswerText(""); setAnswerError(""); }}
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

          {!isOwnNote && (
            isLoggedIn ? (
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
                  style={{ background: "var(--btn-dark)" }}
                >
                  {loading ? "…" : "Sor"}
                </button>
              </form>
            ) : (
              <p className="text-xs text-gray-400">Soru sormak için giriş yapmalısınız.</p>
            )
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
