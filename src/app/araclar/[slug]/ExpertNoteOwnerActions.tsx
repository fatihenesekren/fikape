"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Not sahibine Düzenle/Sil/Paylaş — önceden yalnız /usta-gorusu/notlarim'de
// vardı, araç sayfasındaki notun kendisinden erişim yoktu (kullanıcı fark
// etti). "Paylaş" burada ayrı bir kart/görsel sayfası değil (Yorum'daki gibi
// bir OG-kart üretmiyor) — notun kendi çapasının linkini panoya kopyalıyor,
// daha büyük bir "paylaşım kartı" istenirse ayrı bir iş olarak ele alınabilir.
export function ExpertNoteOwnerActions({ noteId }: { noteId: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleDelete() {
    if (!confirm("Bu usta notunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/expert-notes/${noteId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Silinemedi.");
        setDeleting(false);
      }
    } catch {
      alert("Bağlantı hatası.");
      setDeleting(false);
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
    <div className="flex items-center gap-3">
      <button type="button" onClick={handleShare} className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
        {copied ? "Kopyalandı ✓" : "↗ Paylaş"}
      </button>
      <Link href={`/usta-gorusu/notlarim/${noteId}/duzenle`} className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
        ✎ Düzenle
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs font-semibold text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
      >
        {deleting ? "Siliniyor…" : "Sil"}
      </button>
    </div>
  );
}
