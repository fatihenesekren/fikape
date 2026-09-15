"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// Düzenle/Sil — yalnız kendi notunun sahibi görür (server-side zaten kendi
// notlarını listeliyor). Silme yumuşak (status=HIDDEN), geri alınamaz —
// tek onay adımı yeterli görüldü (Review silme deseniyle aynı sadelik).
export function ExpertNoteRowActions({ noteId }: { noteId: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
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

  return (
    <div>
      <div className="flex items-center gap-4">
        <Link href={`/usta-gorusu/notlarim/${noteId}/duzenle`} className="text-xs font-semibold text-link hover:underline">
          Düzenle
        </Link>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={deleting}
          className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
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
