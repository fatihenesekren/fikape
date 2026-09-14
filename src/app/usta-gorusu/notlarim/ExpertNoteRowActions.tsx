"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Düzenle/Sil — yalnız kendi notunun sahibi görür (server-side zaten kendi
// notlarını listeliyor). Silme yumuşak (status=HIDDEN), geri alınamaz —
// tek onay adımı yeterli görüldü (Review silme deseniyle aynı sadelik).
export function ExpertNoteRowActions({ noteId }: { noteId: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

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

  return (
    <div className="flex items-center gap-4">
      <Link href={`/usta-gorusu/notlarim/${noteId}/duzenle`} className="text-xs font-semibold text-link hover:underline">
        Düzenle
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
      >
        {deleting ? "Siliniyor…" : "Sil"}
      </button>
    </div>
  );
}
