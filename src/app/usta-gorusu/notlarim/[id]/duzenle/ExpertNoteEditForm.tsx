"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EXPERT_NOTE_FIELDS,
  EXPERT_NOTE_TITLE_MAX,
  EXPERT_NOTE_BODY_MIN,
  EXPERT_NOTE_BODY_MAX,
} from "@/lib/expertNote";

// Model seçici yok — bir notun modeli sonradan değişmez (bkz. schema.omit).
// PATCH sonrası PUBLISHED/REJECTED bir not yeniden PENDING'e düşer (moderasyon
// atlanmaz), bu formda da açıkça belirtilir.
export function ExpertNoteEditForm({
  noteId,
  wasPublished,
  initialTitle,
  initialBody,
  initialStructured,
}: {
  noteId: number;
  wasPublished: boolean;
  initialTitle: string;
  initialBody: string;
  initialStructured: Record<string, string>;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [structured, setStructured] = useState<Record<string, string>>(initialStructured);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const bodyLen = body.trim().length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (title.trim().length < 8) return setError("Başlık en az 8 karakter olmalıdır.");
    if (bodyLen < EXPERT_NOTE_BODY_MIN) return setError(`Not en az ${EXPERT_NOTE_BODY_MIN} karakter olmalıdır.`);

    setLoading(true);
    try {
      const res = await fetch(`/api/expert-notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), structured }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        setLoading(false);
        return;
      }
      router.push("/usta-gorusu/notlarim");
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Notu Düzenle</h1>
      {wasPublished && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3 leading-relaxed">
          Bu not şu an yayında. Kaydettiğinizde araç sayfasından geçici olarak
          kalkar ve yeniden incelemeye alınır — onaylandığında tekrar yayınlanır.
        </p>
      )}

      <form onSubmit={submit} className="space-y-6 mt-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Başlık</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, EXPERT_NOTE_TITLE_MAX))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
          <p className="text-[11px] text-gray-400 mt-1 text-right">{title.length}/{EXPERT_NOTE_TITLE_MAX}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teknik notunuz</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, EXPERT_NOTE_BODY_MAX))}
            rows={6}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 resize-y"
          />
          <p className={`text-[11px] mt-1 text-right ${bodyLen < EXPERT_NOTE_BODY_MIN ? "text-orange-500" : "text-gray-400"}`}>
            {bodyLen}/{EXPERT_NOTE_BODY_MAX} {bodyLen < EXPERT_NOTE_BODY_MIN && `· en az ${EXPERT_NOTE_BODY_MIN}`}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Yapılandırılmış başlıklar (opsiyonel)</p>
          {EXPERT_NOTE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{f.label}</label>
              <textarea
                value={structured[f.key] ?? ""}
                onChange={(e) =>
                  setStructured((s) => ({ ...s, [f.key]: e.target.value.slice(0, f.maxLength) }))
                }
                rows={2}
                placeholder={f.placeholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-y"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "#111" }}
          >
            {loading ? "Kaydediliyor…" : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/usta-gorusu/notlarim")}
            className="text-sm text-gray-400 hover:text-gray-700"
          >
            Vazgeç
          </button>
        </div>
      </form>
    </div>
  );
}
