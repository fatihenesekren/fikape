"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hhmm } from "@/lib/messageTime";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EXPERT_STATUS_TONES } from "@/lib/expertNote";

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

// Önceden ikisi de tek bir sabit renkte (amber) gösteriliyordu — anlamsal
// olarak yanlış, "İnceleniyor" ile "Reddedildi" aynı şey değil. Notun kendi
// durum rozetleriyle (EXPERT_STATUS_TONES) aynı renk diline bağlandı (renk/
// tasarım sistemi denetimi bulgusu).
const ANSWER_STATUS_TONE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "İnceleniyor", ...EXPERT_STATUS_TONES.warning },
  REJECTED: { label: "Reddedildi", ...EXPERT_STATUS_TONES.danger },
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

  // Soruyu soranın kendi sorusunu düzenlemesi/silmesi — kullanıcı fark etti,
  // önceden hiç mümkün değildi.
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editQuestionLoading, setEditQuestionLoading] = useState(false);
  const [editQuestionError, setEditQuestionError] = useState("");
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null);
  // window.confirm() sitenin hiçbir yerinde kullanılmıyor (kullanıcı fark
  // etti) — soru/cevap silme onayı ConfirmDialog'a taşındı, tek bir state
  // hangi hedefin (soru mu cevap mı, hangi id) onaylanacağını tutuyor.
  const [confirmTarget, setConfirmTarget] = useState<{ type: "question" | "answer"; id: number } | null>(null);
  const [deleteError, setDeleteError] = useState("");

  async function saveQuestionEdit(e: React.FormEvent, questionId: number) {
    e.preventDefault();
    if (editQuestionText.trim().length < 10) return setEditQuestionError("En az 10 karakter yazınız.");
    setEditQuestionLoading(true);
    setEditQuestionError("");
    try {
      const res = await fetch(`/api/expert-notes/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editQuestionText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditQuestionError(data.error ?? "Bir hata oluştu.");
        setEditQuestionLoading(false);
        return;
      }
      setEditingQuestionId(null);
      setEditQuestionLoading(false);
      router.refresh();
    } catch {
      setEditQuestionError("Bağlantı hatası.");
      setEditQuestionLoading(false);
    }
  }

  async function deleteQuestion(questionId: number) {
    setDeletingQuestionId(questionId);
    setDeleteError("");
    try {
      const res = await fetch(`/api/expert-notes/questions/${questionId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error ?? "Silinemedi.");
      }
    } finally {
      setDeletingQuestionId(null);
      setConfirmTarget(null);
    }
  }

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
    setDeletingAnswerId(answerId);
    setDeleteError("");
    try {
      const res = await fetch(`/api/answers/${answerId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error ?? "Silinemedi.");
      }
    } finally {
      setDeletingAnswerId(null);
      setConfirmTarget(null);
    }
  }

  function confirmDelete() {
    if (!confirmTarget) return;
    if (confirmTarget.type === "question") deleteQuestion(confirmTarget.id);
    else deleteAnswer(confirmTarget.id);
  }

  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const visibleQuestions = showAllQuestions ? questions : questions.slice(0, 3);
  const hiddenCount = questions.length - visibleQuestions.length;

  return (
    // Önceden burada İKİNCİ bir "border-t border-gray-50" vardı — hemen
    // üstündeki oy/sahip-aksiyonları footer'ı da AYNI çizgiyle bitiyordu,
    // iki ardışık aynı ağırlıkta ayraç widget'ı notun bir devamı değil,
    // bağımsız bir bölüm gibi gösteriyordu (kullanıcı: "yoruma entegre
    // bir kısım ama ayırt edilebilir değil" — bilgi mimarisi denetimi
    // bulgusu). Tek ayraç (üstteki footer'ınki) yeterli, burada yalnız boşluk var.
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full px-2.5 py-1 -ml-2.5 transition-colors"
      >
        💬 Soru sor {questions.length > 0 ? `(${questions.length})` : ""}
        <span className="text-gray-300">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {visibleQuestions.map((q) => {
            const myAnswer = currentUserId != null ? q.answers.find((a) => a.authorUserId === currentUserId) : undefined;
            // Kullanıcı kararı: bir soruya toplamda tek cevap — biri
            // (herhangi bir usta) zaten cevaplamışsa başkasına "Cevap ver"
            // gösterilmez, yalnız cevaplayan kendi cevabını yönetebilir.
            const canAnswerThis = canAnswer && currentUserId != null && q.authorUserId !== currentUserId
              && q.answers.length === 0;
            const isEditingMyAnswer = myAnswer != null && editingAnswerId === myAnswer.id;

            const isOwnQuestion = q.authorUserId === currentUserId;
            const isEditingThisQuestion = isOwnQuestion && editingQuestionId === q.id;

            return (
              <div key={q.id} className="bg-gray-50 rounded-lg px-3 py-2 space-y-2">
                {isEditingThisQuestion ? (
                  <div>
                    <form onSubmit={(e) => saveQuestionEdit(e, q.id)} className="flex items-start gap-2">
                      <input
                        type="text"
                        value={editQuestionText}
                        onChange={(e) => setEditQuestionText(e.target.value.slice(0, 300))}
                        autoFocus
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                      />
                      <button
                        type="submit"
                        disabled={editQuestionLoading}
                        className="px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 shrink-0"
                        style={{ background: "var(--btn-dark)" }}
                      >
                        {editQuestionLoading ? "…" : "Kaydet"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingQuestionId(null); setEditQuestionError(""); }}
                        className="text-xs text-gray-400 hover:text-gray-700 shrink-0 py-2"
                      >
                        Vazgeç
                      </button>
                    </form>
                    {editQuestionError && <p className="text-xs text-red-600 mt-1">{editQuestionError}</p>}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{q.authorName}:</span> {q.text}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-gray-400">{formatDateTime(q.createdAt)}</span>
                      {isOwnQuestion && (
                        <>
                          <button
                            type="button"
                            onClick={() => { setEditingQuestionId(q.id); setEditQuestionText(q.text); setEditQuestionError(""); }}
                            className="text-xs font-semibold text-link hover:underline"
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ type: "question", id: q.id })}
                            disabled={deletingQuestionId === q.id}
                            className="text-xs font-semibold hover:opacity-70 disabled:opacity-50 transition-opacity"
                            style={{ color: EXPERT_STATUS_TONES.danger.color }}
                          >
                            {deletingQuestionId === q.id ? "Siliniyor…" : "Sil"}
                          </button>
                        </>
                      )}
                    </div>
                    {isOwnQuestion && editingQuestionId === q.id && editQuestionError && (
                      <p className="text-xs text-red-600 mt-1">{editQuestionError}</p>
                    )}
                  </div>
                )}

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
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold text-gray-800">{a.authorName}:</span> {a.text}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-gray-400">{formatDateTime(a.createdAt)}</span>
                          {a.status !== "PUBLISHED" && (
                            <span
                              className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ color: ANSWER_STATUS_TONE[a.status].color, background: ANSWER_STATUS_TONE[a.status].bg }}
                            >
                              {ANSWER_STATUS_TONE[a.status].label}
                            </span>
                          )}
                          {a.authorUserId === currentUserId && (
                            <>
                              <button
                                type="button"
                                onClick={() => { setEditingAnswerId(a.id); setAnswerText(a.text); setAnswerError(""); }}
                                className="text-xs font-semibold text-link hover:underline"
                              >
                                Düzenle
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmTarget({ type: "answer", id: a.id })}
                                disabled={deletingAnswerId === a.id}
                                className="text-xs font-semibold hover:opacity-70 disabled:opacity-50 transition-opacity"
                                style={{ color: EXPERT_STATUS_TONES.danger.color }}
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
                  <p className="text-xs italic" style={{ color: EXPERT_STATUS_TONES.success.color }}>
                    Cevabınız gönderildi, incelemeye alındı.
                  </p>
                )}

                {/* Cevap yokken de aynı sol-çizgili raya oturur — önceden
                    cevaplıyken içeride (pl-3 border-l-2), cevapsızken tam
                    genişlikte duruyordu; aynı eylemin iki farklı hizada
                    görünmesi tutarsızdı (bilgi mimarisi denetimi bulgusu). */}
                {canAnswerThis && (
                  <div className="pl-3 border-l-2 border-gray-200">
                    {answeringId === q.id ? (
                      <form onSubmit={(e) => submitAnswer(e, q.id)} className="flex items-start gap-2">
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
                          className="text-xs font-semibold text-link hover:underline"
                        >
                          Cevap ver →
                        </button>
                      )
                    )}
                    {answeringId === q.id && answerError && (
                      <p className="text-xs text-red-600 mt-1">{answerError}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {questions.length === 0 && (
            <p className="text-xs text-gray-400">Henüz soru sorulmamış.</p>
          )}
          {hiddenCount > 0 && (
            // Uzun notlarda Q&A widget'ı notun kendisinden daha baskın hale
            // gelmesin diye ilk 3 soru sonrası daraltılıyor (bilgi mimarisi
            // denetimi önerisi).
            <button
              type="button"
              onClick={() => setShowAllQuestions(true)}
              className="text-xs font-semibold text-link hover:underline"
            >
              {hiddenCount} soru daha göster
            </button>
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
          {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
        </div>
      )}

      <ConfirmDialog
        open={confirmTarget != null}
        title={confirmTarget?.type === "question" ? "Soruyu sil" : "Cevabı sil"}
        description={
          confirmTarget?.type === "question"
            ? "Bu soruyu (varsa altındaki cevapla birlikte) silmek istediğinize emin misiniz?"
            : "Bu cevabı silmek istediğinize emin misiniz?"
        }
        loading={confirmTarget?.type === "question" ? deletingQuestionId === confirmTarget.id : deletingAnswerId === confirmTarget?.id}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
