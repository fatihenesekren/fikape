"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { watermarkImage } from "@/lib/watermarkImage";

export interface ExistingPhoto {
  id: number;
  url: string;
}

export function PhotoUploader({
  existingPhotos = [],
  removedExistingIds,
  onToggleRemoveExisting,
  newPhotoUrls,
  onNewPhotoUrlsChange,
  max = 5,
}: {
  existingPhotos?: ExistingPhoto[];
  removedExistingIds: number[];
  onToggleRemoveExisting: (id: number) => void;
  newPhotoUrls: string[];
  onNewPhotoUrlsChange: (urls: string[]) => void;
  max?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const remainingExisting = existingPhotos.filter((p) => !removedExistingIds.includes(p.id));
  const total = remainingExisting.length + newPhotoUrls.length;

  return (
    <div className="space-y-3 pt-1">
      <p className="text-sm font-semibold text-gray-800">
        Fotoğraf <span className="text-gray-400 font-normal">(opsiyonel, maks. {max})</span>
      </p>

      {(remainingExisting.length > 0 || newPhotoUrls.length > 0) && (
        <div className="flex gap-2 flex-wrap">
          {remainingExisting.map((p) => (
            <div key={`existing-${p.id}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="Fotoğraf" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onToggleRemoveExisting(p.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs leading-none hover:bg-black/80"
                aria-label="Fotoğrafı kaldır"
              >
                ×
              </button>
            </div>
          ))}
          {newPhotoUrls.map((url, idx) => (
            <div key={`new-${url}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Yeni fotoğraf ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onNewPhotoUrlsChange(newPhotoUrls.filter((u) => u !== url))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs leading-none hover:bg-black/80"
                aria-label="Fotoğrafı kaldır"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {total < max && (
        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-sm font-semibold cursor-pointer transition-colors ${uploading ? "border-gray-200 text-gray-300" : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700"}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          {uploading ? "Yükleniyor..." : `Fotoğraf seç (${total}/${max})`}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              const remaining = max - total;
              const toUpload = files.slice(0, remaining);
              const skipped = files.length - toUpload.length;

              setUploading(true);
              const uploaded: string[] = [];
              const errors: string[] = [];
              if (skipped > 0) {
                errors.push(`En fazla ${max} fotoğraf ekleyebilirsiniz — ${skipped} fotoğraf seçilmedi.`);
              }

              for (const file of toUpload) {
                try {
                  const watermarked = await watermarkImage(file).catch(() => file);
                  const blob = await upload(`reviews/${Date.now()}-${file.name}`, watermarked, {
                    access: "public",
                    handleUploadUrl: "/api/uploads/review-photo",
                  });
                  uploaded.push(blob.url);
                } catch (err) {
                  errors.push(`${file.name}: ${err instanceof Error ? err.message : "Yüklenemedi."}`);
                }
              }

              if (uploaded.length) onNewPhotoUrlsChange([...newPhotoUrls, ...uploaded]);
              setUploadErrors(errors);
              setUploading(false);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {uploadErrors.length > 0 && (
        <div className="text-xs text-red-600 space-y-0.5">
          {uploadErrors.map((err, i) => <p key={i}>⚠ {err}</p>)}
        </div>
      )}
      <p className="text-xs text-amber-600 font-medium">Fotoğraftaki plaka ve yüzleri gizli tutun — yüklemeden önce kendiniz kapatın ya da göstermeyin. Atlarsanız KVKK gereği moderasyon ekibimiz düzenler.</p>
      <p className="text-xs text-gray-400">JPEG, PNG veya WebP · maks. 25 MB · moderasyon onayından sonra yayınlanır</p>
    </div>
  );
}
