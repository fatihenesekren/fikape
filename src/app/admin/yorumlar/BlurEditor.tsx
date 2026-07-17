"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Rect { x: number; y: number; w: number; h: number; }

const BLOCK_SIZE = 14;

function pixelate(ctx: CanvasRenderingContext2D, r: Rect) {
  const x = Math.round(r.x), y = Math.round(r.y);
  const w = Math.round(r.w), h = Math.round(r.h);
  if (w <= 0 || h <= 0) return;
  const data = ctx.getImageData(x, y, w, h);
  const px = data.data;
  for (let by = 0; by < h; by += BLOCK_SIZE) {
    for (let bx = 0; bx < w; bx += BLOCK_SIZE) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let py = by; py < Math.min(by + BLOCK_SIZE, h); py++) {
        for (let pp = bx; pp < Math.min(bx + BLOCK_SIZE, w); pp++) {
          const i = (py * w + pp) * 4;
          r += px[i]; g += px[i + 1]; b += px[i + 2]; count++;
        }
      }
      r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
      for (let py = by; py < Math.min(by + BLOCK_SIZE, h); py++) {
        for (let pp = bx; pp < Math.min(bx + BLOCK_SIZE, w); pp++) {
          const i = (py * w + pp) * 4;
          px[i] = r; px[i + 1] = g; px[i + 2] = b;
        }
      }
    }
  }
  ctx.putImageData(data, x, y);
}

export function BlurEditor({
  photoId,
  url,
  onSave,
  onClose,
}: {
  photoId: number;
  url: string;
  onSave: (newUrl: string) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [activeRect, setActiveRect] = useState<Rect | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const redraw = useCallback((rectList: Rect[], active: Rect | null) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const r of rectList) pixelate(ctx, r);
    if (active && active.w > 0 && active.h > 0) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(active.x, active.y, active.w, active.h);
      ctx.fillStyle = "rgba(239,68,68,0.15)";
      ctx.fillRect(active.x, active.y, active.w, active.h);
      ctx.setLineDash([]);
    }
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxW = 680;
      const s = img.width > maxW ? maxW / img.width : 1;
      canvas.width = Math.round(img.width * s);
      canvas.height = Math.round(img.height * s);
      redraw([], null);
      setLoaded(true);
    };
    img.src = url;
  }, [url, redraw]);

  function getPos(clientX: number, clientY: number): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function beginDraw(clientX: number, clientY: number) {
    setStartPos(getPos(clientX, clientY));
    setDrawing(true);
  }

  function moveDraw(clientX: number, clientY: number) {
    if (!drawing || !startPos) return;
    const pos = getPos(clientX, clientY);
    const active: Rect = {
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y),
    };
    setActiveRect(active);
    redraw(rects, active);
  }

  function endDraw() {
    if (!drawing) return;
    setDrawing(false);
    if (activeRect && activeRect.w > 8 && activeRect.h > 8) {
      const newRects = [...rects, activeRect];
      setRects(newRects);
      redraw(newRects, null);
    }
    setActiveRect(null);
    setStartPos(null);
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    beginDraw(e.clientX, e.clientY);
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    moveDraw(e.clientX, e.clientY);
  }

  function onMouseUp() {
    endDraw();
  }

  // Mobilde parmakla sürükleyerek kutu çizebilmek için — canvas eskiden
  // sadece mouse olaylarını dinliyordu, dokunmatik ekranlarda hiçbir şey
  // yapmıyordu. preventDefault ile touchAction:none üzerinden sayfa kaymasını
  // da engelliyoruz.
  function onTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const t = e.touches[0];
    if (t) beginDraw(t.clientX, t.clientY);
  }

  function onTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const t = e.touches[0];
    if (t) moveDraw(t.clientX, t.clientY);
  }

  function onTouchEnd(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    endDraw();
  }

  function undo() {
    const newRects = rects.slice(0, -1);
    setRects(newRects);
    redraw(newRects, null);
  }

  async function save() {
    const canvas = canvasRef.current!;
    setSaving(true);
    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", 0.92)
    );
    const fd = new FormData();
    fd.append("file", blob, "photo.jpg");
    fd.append("photoId", String(photoId));
    const res = await fetch("/api/admin/photos/blur", { method: "POST", body: fd });
    if (res.ok) {
      const { url: newUrl } = await res.json() as { url: string };
      onSave(newUrl);
    }
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <p className="font-bold text-gray-900 text-sm">Bölge Bulanıklaştır</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Plaka veya yüz üzerine dikdörtgen çiz → Kaydet
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Canvas */}
        <div className="overflow-auto p-4 flex-1 flex items-center justify-center bg-gray-50">
          {!loaded && (
            <p className="text-sm text-gray-400">Yükleniyor...</p>
          )}
          <canvas
            ref={canvasRef}
            className="block max-w-full rounded-xl shadow-sm"
            style={{
              cursor: "crosshair",
              display: loaded ? "block" : "none",
              touchAction: "none",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
          />
        </div>

        {/* Alt bar */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={undo}
            disabled={rects.length === 0}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ↩ Geri al
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={save}
              disabled={saving || rects.length === 0}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-colors"
              style={{ background: "#16a34a" }}
            >
              {saving ? "Kaydediliyor..." : `Kaydet (${rects.length} bölge)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
