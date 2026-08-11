"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// angle: radyan, dikdörtgenin merkezi etrafında saat yönünde dönüş — araç fotoğrafı
// çapraz çekilmişse plaka/yüz de çapraz durur, eksene sabit dikdörtgen o zaman ya
// bölgeyi eksik kapatır ya da gereğinden fazla alanı bulanıklaştırır.
interface Rect { x: number; y: number; w: number; h: number; angle: number; }

const BLOCK_SIZE = 14;

function pixelateAxisAligned(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
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

// Dönük bir dikdörtgeni pikselleştirmek için getImageData/putImageData eksen-hizalı
// çalışır, doğrudan dönük bölge okunamaz. Yöntem: kaynak görseli merkez etrafında
// -angle döndürerek geçici bir tuvale çiz (böylece hedef bölge o tuvalde eksene
// hizalanmış olur) → o eksene-hizalı bölgeyi pikselleştir → küçük bir yamaya kopyala
// → ana tuvale +angle döndürerek doğru konum/açıda geri yapıştır.
function applyBlur(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, img: HTMLImageElement, r: Rect) {
  const w = Math.round(r.w), h = Math.round(r.h);
  if (w <= 0 || h <= 0) return;
  if (!r.angle) {
    pixelateAxisAligned(ctx, Math.round(r.x), Math.round(r.y), w, h);
    return;
  }
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;

  const tmp = document.createElement("canvas");
  tmp.width = canvas.width;
  tmp.height = canvas.height;
  const tctx = tmp.getContext("2d")!;
  tctx.translate(cx, cy);
  tctx.rotate(-r.angle);
  tctx.translate(-cx, -cy);
  tctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const x = Math.round(cx - r.w / 2), y = Math.round(cy - r.h / 2);
  pixelateAxisAligned(tctx, x, y, w, h);
  const patch = tctx.getImageData(x, y, w, h);
  const patchCanvas = document.createElement("canvas");
  patchCanvas.width = w;
  patchCanvas.height = h;
  patchCanvas.getContext("2d")!.putImageData(patch, 0, 0);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(r.angle);
  ctx.drawImage(patchCanvas, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function hitTest(rects: Rect[], px: number, py: number): number | null {
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const dx = px - cx, dy = py - cy;
    const cos = Math.cos(-r.angle), sin = Math.sin(-r.angle);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    if (Math.abs(lx) <= r.w / 2 && Math.abs(ly) <= r.h / 2) return i;
  }
  return null;
}

export function BlurEditor({
  photoId,
  productSlug,
  url,
  onSave,
  onClose,
}: {
  photoId?: number;
  productSlug?: string;
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const redraw = useCallback((rectList: Rect[], active: Rect | null, selIdx?: number | null) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const r of rectList) applyBlur(ctx, canvas, img, r);
    if (selIdx != null && rectList[selIdx]) {
      const r = rectList[selIdx];
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(r.angle);
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h);
      ctx.restore();
      ctx.setLineDash([]);
    }
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
    img.onerror = () => setLoadError(true);
    // Görsel farklı bir origin'den geliyorsa (Wikimedia Commons, basın kiti vb.) ve
    // CORS header'ı yoksa tuvel "kirlenip" pikselleştirme başarısız olur — kendi
    // sunucumuz üzerinden proxy'leyerek bu sorunu tamamen ortadan kaldırıyoruz.
    img.src = `/api/admin/image-proxy?url=${encodeURIComponent(url)}`;
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
    const pos = getPos(clientX, clientY);
    const hit = hitTest(rects, pos.x, pos.y);
    if (hit != null) {
      setSelectedIndex(hit);
      redraw(rects, null, hit);
      return;
    }
    setSelectedIndex(null);
    setStartPos(pos);
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
      angle: 0,
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
      setSelectedIndex(newRects.length - 1);
      redraw(newRects, null, newRects.length - 1);
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

  function setSelectedAngleDeg(deg: number) {
    if (selectedIndex == null) return;
    const newRects = rects.map((r, i) => (i === selectedIndex ? { ...r, angle: (deg * Math.PI) / 180 } : r));
    setRects(newRects);
    redraw(newRects, null, selectedIndex);
  }

  function nudgeSelectedAngle(deltaDeg: number) {
    if (selectedIndex == null) return;
    const currentDeg = (rects[selectedIndex].angle * 180) / Math.PI;
    setSelectedAngleDeg(currentDeg + deltaDeg);
  }

  function removeSelected() {
    if (selectedIndex == null) return;
    const newRects = rects.filter((_, i) => i !== selectedIndex);
    setRects(newRects);
    setSelectedIndex(null);
    redraw(newRects, null);
  }

  function undo() {
    const newRects = rects.slice(0, -1);
    setRects(newRects);
    setSelectedIndex(null);
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
    let endpoint: string;
    if (photoId != null) {
      fd.append("photoId", String(photoId));
      endpoint = "/api/admin/photos/blur";
    } else if (productSlug) {
      endpoint = `/api/admin/products/${encodeURIComponent(productSlug)}/image/blur`;
    } else {
      setSaving(false);
      return;
    }
    const res = await fetch(endpoint, { method: "POST", body: fd });
    if (res.ok) {
      const { url: newUrl } = await res.json() as { url: string };
      onSave(newUrl);
    }
    setSaving(false);
  }

  const selectedAngleDeg = selectedIndex != null ? Math.round((rects[selectedIndex].angle * 180) / Math.PI) : 0;

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
              Plaka veya yüz üzerine dikdörtgen çiz → Kaydet. Araç çaprazsa çizilen
              bölgeyi seçip döndürebilirsin.
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
          {!loaded && !loadError && (
            <p className="text-sm text-gray-400">Yükleniyor...</p>
          )}
          {loadError && (
            <p className="text-sm text-red-500 text-center px-4">
              Görsel yüklenemedi. URL&apos;in doğru ve erişilebilir olduğundan emin olun.
            </p>
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

        {/* Döndürme kontrolü — bir bölge seçiliyken görünür */}
        {selectedIndex != null && (
          <div className="px-5 py-3 border-t border-gray-100 bg-blue-50/50 flex items-center gap-3 shrink-0">
            <button
              onClick={() => nudgeSelectedAngle(-5)}
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              title="5° sola döndür"
            >
              ↺
            </button>
            <input
              type="range"
              min={-60}
              max={60}
              step={1}
              value={selectedAngleDeg}
              onChange={(e) => setSelectedAngleDeg(Number(e.target.value))}
              className="flex-1"
            />
            <button
              onClick={() => nudgeSelectedAngle(5)}
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              title="5° sağa döndür"
            >
              ↻
            </button>
            <span className="text-xs font-mono text-gray-500 w-10 text-right shrink-0">{selectedAngleDeg}°</span>
            <button
              onClick={removeSelected}
              className="text-xs font-semibold text-red-500 hover:text-red-600 shrink-0"
            >
              Bu bölgeyi sil
            </button>
          </div>
        )}

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
