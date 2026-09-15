"use client";

// Paylaşılan silme/onay bottom-sheet'i — tarayıcının çirkin, sitenin
// geri kalanıyla hiç uyuşmayan yerleşik confirm() penceresi yerine.
// Görsel dil Takas Mesajlarım'daki "kişiyi engelle" onayıyla (bkz.
// mesajlar/[threadId]/ThreadActions.tsx) ve usta-mesajlarim/[id]/
// ExpertThreadView.tsx'teki aynı desenle BİREBİR aynı — o ikisi de
// kullanıcı "window.confirm() sitenin hiçbir yerinde kullanılmıyor"
// dediği için bu deseni almıştı; şimdi tek bir bileşende toplanıp geri
// kalan confirm() çağrıları da buna geçirildi.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Sil",
  cancelLabel = "Vazgeç",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6"
      onClick={onCancel}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 text-left" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-gray-900 mb-1.5">{title}</h3>
        {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
        <div className="flex items-center gap-2 justify-end">
          <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:underline px-2">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors ${
              danger ? "bg-red-600 hover:bg-red-700" : ""
            }`}
            style={!danger ? { background: "var(--btn-dark)" } : undefined}
          >
            {loading ? "İşleniyor…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
