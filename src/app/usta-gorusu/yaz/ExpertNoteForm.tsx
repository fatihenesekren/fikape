"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  EXPERT_NOTE_FIELDS,
  EXPERT_NOTE_TITLE_MAX,
  EXPERT_NOTE_BODY_MIN,
  EXPERT_NOTE_BODY_MAX,
  EXPERT_NOTE_DISCLAIMER,
} from "@/lib/expertNote";

interface ModelResult {
  id: number;
  slug: string;
  brandName: string;
  modelName: string;
  categorySlug: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  otomobil: "Otomobil", motosiklet: "Motosiklet", "e-scooter": "E-Scooter",
  "e-bisiklet": "E-Bisiklet", karavan: "Karavan", kamyonet: "Kamyonet",
};

export function ExpertNoteForm({ headline }: { headline: string | null }) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ModelResult[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selected, setSelected] = useState<ModelResult | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [structured, setStructured] = useState<Record<string, string>>({});

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (selected || q.length < 2) {
      const t = setTimeout(() => { setResults([]); setDropdownOpen(false); }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/models?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          setResults(await res.json());
          setDropdownOpen(true);
        }
      } catch {
        /* sessiz */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, selected]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const bodyLen = body.trim().length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selected) return setError("Bir araç modeli seçiniz.");
    if (title.trim().length < 8) return setError("Başlık en az 8 karakter olmalıdır.");
    if (bodyLen < EXPERT_NOTE_BODY_MIN) return setError(`Not en az ${EXPERT_NOTE_BODY_MIN} karakter olmalıdır.`);

    setLoading(true);
    try {
      const res = await fetch("/api/expert-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: selected.id,
          title: title.trim(),
          body: body.trim(),
          structured,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        setLoading(false);
        return;
      }
      router.push("/usta-gorusu/yaz?gonderildi=1");
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Usta Görüşü Yaz</h1>
        {headline && <p className="text-sm text-gray-400 mt-1">{headline}</p>}
        <p className="text-xs text-gray-400 mt-3 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
          {EXPERT_NOTE_DISCLAIMER} Notunuz yayınlanmadan önce incelenir.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Model seçici */}
        <div ref={boxRef} className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Araç modeli</label>
          {selected ? (
            <div className="flex items-center justify-between gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-white">
              <span className="text-sm text-gray-800 truncate">
                <span className="font-semibold">{selected.brandName} {selected.modelName}</span>
                {selected.categorySlug && (
                  <span className="text-gray-400"> · {CATEGORY_LABELS[selected.categorySlug] ?? selected.categorySlug}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => { setSelected(null); setQuery(""); }}
                className="text-xs text-gray-400 hover:text-gray-700 shrink-0"
              >
                değiştir
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setDropdownOpen(true)}
                placeholder="Marka veya model ara…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
              />
              {dropdownOpen && results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => { setSelected(r); setDropdownOpen(false); }}
                      className="block w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50"
                    >
                      <span className="font-medium text-gray-800">{r.brandName} {r.modelName}</span>
                      {r.categorySlug && (
                        <span className="text-gray-400"> · {CATEGORY_LABELS[r.categorySlug] ?? r.categorySlug}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <p className="text-[11px] text-gray-400 mt-1">
            Usta görüşü belirli bir modele yazılır — tek bir araca veya yıla değil.
          </p>
        </div>

        {/* Başlık */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Başlık</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, EXPERT_NOTE_TITLE_MAX))}
            placeholder="Örn: 1.6 dizel motorda 120 bin km sonrası enjektör sorunu"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
          <p className="text-[11px] text-gray-400 mt-1 text-right">{title.length}/{EXPERT_NOTE_TITLE_MAX}</p>
        </div>

        {/* Gövde */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teknik notunuz</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, EXPERT_NOTE_BODY_MAX))}
            rows={6}
            placeholder="Bu model hakkında bildikleriniz — teknik, deneyime dayalı, ölçülü. İletişim bilgisi, marka reklamı veya 'bana ulaşın' türü ifadeler yazmayın."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 resize-y"
          />
          <p className={`text-[11px] mt-1 text-right ${bodyLen < EXPERT_NOTE_BODY_MIN ? "text-orange-500" : "text-gray-400"}`}>
            {bodyLen}/{EXPERT_NOTE_BODY_MAX} {bodyLen < EXPERT_NOTE_BODY_MIN && `· en az ${EXPERT_NOTE_BODY_MIN}`}
          </p>
        </div>

        {/* Yapılandırılmış alanlar */}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "#111" }}
        >
          {loading ? "Gönderiliyor…" : "İncelemeye gönder"}
        </button>
      </form>
    </div>
  );
}
