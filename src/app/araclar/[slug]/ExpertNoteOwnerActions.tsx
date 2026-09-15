"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// Not sahibine Düzenle/Sil/Paylaş — önceden yalnız /usta-gorusu/notlarim'de
// vardı, araç sayfasındaki notun kendisinden erişim yoktu (kullanıcı fark
// etti). "Paylaş" burada ayrı bir kart/görsel sayfası değil (Yorum'daki gibi
// bir OG-kart üretmiyor) — notun kendi çapasının linkini panoya kopyalıyor,
// daha büyük bir "paylaşım kartı" istenirse ayrı bir iş olarak ele alınabilir.
export function ExpertNoteOwnerActions({ noteId }: { noteId: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  // window.confirm() sitenin hiçbir yerinde kullanılmıyor (kullanıcı fark
  // etti) — ConfirmDialog ile aynı bottom-sheet desenine geçirildi.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/expert-notes/${noteId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Silinemedi.");
        setDeleting(false);
        setConfirmOpen(false);
      }
    } catch {
      setError("Bağlantı hatası.");
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}?sekme=usta-gorusleri#usta-not-${noteId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* pano erişimi reddedildiyse sessiz geç */
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={handleShare} className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
          {copied ? "Kopyalandı ✓" : "↗ Paylaş"}
        </button>
        <Link href={`/usta-gorusu/notlarim/${noteId}/duzenle`} className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
          ✎ Düzenle
        </Link>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={deleting}
          className="text-xs font-semibold text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
        >
          {deleting ? "Siliniyor…" : "Sil"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      <ConfirmDialog
        open={confirmOpen}
        title="Usta notunu sil"
        description="Bu usta notunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
