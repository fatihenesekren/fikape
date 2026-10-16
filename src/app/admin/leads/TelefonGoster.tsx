"use client";

import { useEffect, useRef, useState } from "react";

const GIZLE_MS = 30_000;

/** Maskeli telefon; "Göster" tek kaydın tam numarasını getirir (denetim kaydına yazılır) ve 30 sn sonra tekrar gizler. */
export function TelefonGoster({ id, kind, maskeli }: { id: number; kind: "insurance" | "sale"; maskeli: string }) {
  const [tam, setTam] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState(false);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (zamanlayici.current) clearTimeout(zamanlayici.current); }, []);

  async function goster() {
    setYukleniyor(true);
    setHata(false);
    try {
      const res = await fetch(`/api/admin/leads/${id}/telefon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (!res.ok) throw new Error("başarısız");
      const { phone } = (await res.json()) as { phone: string };
      setTam(phone);
      zamanlayici.current = setTimeout(() => setTam(null), GIZLE_MS);
    } catch {
      setHata(true);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <span className="font-normal text-gray-500">
      {tam ?? maskeli}{" "}
      {tam === null && (
        <button type="button" onClick={goster} disabled={yukleniyor} className="text-xs text-blue-600 hover:underline disabled:opacity-50">
          {yukleniyor ? "…" : "Göster"}
        </button>
      )}
      {hata && <span className="ml-1 text-xs text-red-500">Alınamadı</span>}
    </span>
  );
}
