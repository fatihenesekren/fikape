"use client";

export function ChipGroup<T extends string>({
  opts, value, onChange, cols,
}: {
  opts: readonly { value: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div
      className="flex flex-wrap gap-2"
      style={cols ? { display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}
    >
      {opts.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all text-center"
            style={
              selected
                ? { background: "#111", borderColor: "#111", color: "#fff" }
                : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function IconChipGroup<T extends string>({
  opts, value, onChange,
}: {
  opts: readonly { value: T; icon: string; label: string }[];
  value: T | null | "";
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {opts.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex-1 py-3 rounded-xl font-semibold border-2 transition-all flex flex-col items-center gap-1"
            style={
              selected
                ? { background: "#111", borderColor: "#111", color: "#fff" }
                : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
            }
          >
            <span className="text-xl">{opt.icon}</span>
            <span className="text-xs">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
          style={
            value === v
              ? { background: "#111", borderColor: "#111", color: "#fff" }
              : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
          }
        >
          {v ? "Evet" : "Hayır"}
        </button>
      ))}
    </div>
  );
}

export function SectionCard({ step, title, badge, locked, lockedHint, children }: {
  step: number; title: string;
  badge?: "required" | "optional" | "conditional";
  locked?: boolean;
  lockedHint?: string;
  children: React.ReactNode;
}) {
  const badgeStyles = {
    required:    { bg: "#fee2e2", color: "#991b1b", label: "Zorunlu" },
    optional:    { bg: "#f3f4f6", color: "#6b7280", label: "Opsiyonel" },
    conditional: { bg: "#fef3c7", color: "#92400e", label: "Koşullu" },
  };
  const b = badge ? badgeStyles[badge] : null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
      <div className="flex items-center gap-3">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "#E6F1FB", color: "#0C447C" }}
        >
          {step}
        </span>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex-1">{title}</h2>
        {b && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: b.bg, color: b.color }}>
            {b.label}
          </span>
        )}
      </div>
      {locked ? (
        <div className="relative">
          <div className="space-y-5 blur-[2px] opacity-60 pointer-events-none select-none" aria-hidden="true">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-center px-4">
            <p className="text-xs font-semibold text-gray-500 bg-white/90 rounded-xl px-4 py-2 border border-gray-200">
              🔒 {lockedHint ?? "Bu bölüm için önce bir araç seçiniz"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">{children}</div>
      )}
    </div>
  );
}

export function SubQuestion({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-semibold text-gray-800">
        {label}
        {hint && <span className="text-xs font-normal text-gray-400 ml-1.5">{hint}</span>}
      </p>
      {children}
    </div>
  );
}

export function VoiceInputButton({ status, message, onStart, onStop, compact }: {
  status: "idle" | "requesting-permission" | "listening" | "error" | "unsupported";
  message?: string | null;
  onStart: () => void;
  onStop: () => void;
  /** Tek satırlık sohbet kutuları gibi dar alanlarda — daha küçük daire, kalın kenarlık yok. */
  compact?: boolean;
}) {
  if (status === "unsupported") return null;

  const listening  = status === "listening";
  const requesting = status === "requesting-permission";
  const hasError   = status === "error";

  const buttonSize = compact ? "w-8 h-8" : "w-11 h-11";
  const borderWidth = compact ? "border" : "border-2";
  const iconSize = compact ? 14 : 18;
  const dotSize = compact ? 10 : 14;
  const dotRectSize = compact ? 8 : 12;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-pressed={listening}
        aria-label={listening ? "Kaydı durdur" : "Sesli giriş başlat"}
        disabled={requesting}
        onClick={listening ? onStop : onStart}
        className={`${buttonSize} rounded-full flex items-center justify-center ${borderWidth} transition-all shrink-0`}
        style={
          listening
            ? { background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b" }
            : requesting
            ? { background: "#f3f4f6", borderColor: "#e5e7eb", color: "#9ca3af" }
            : hasError
            ? { background: "#fef3c7", borderColor: "#fcd34d", color: "#92400e" }
            : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
        }
      >
        {listening ? (
          <span className="relative flex items-center justify-center" aria-hidden="true">
            <span className="absolute -inset-1 rounded-full border-2 border-current opacity-50 animate-pulse motion-reduce:animate-none" />
            <svg width={dotSize} height={dotSize} viewBox="0 0 24 24">
              <rect x={6} y={6} width={dotRectSize} height={dotRectSize} rx={2} fill="currentColor" />
            </svg>
          </span>
        ) : (
          <svg
            aria-hidden="true"
            width={iconSize} height={iconSize} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1={12} y1={19} x2={12} y2={23} />
            <line x1={8} y1={23} x2={16} y2={23} />
          </svg>
        )}
      </button>
      {/* Ekran okuyucu için görünmez durum anonsu — sayaç/rozet değişimini göremeyen kullanıcı için zorunlu. */}
      <span className="sr-only" role="status" aria-live="polite">
        {listening ? "Dinleniyor…" : message ?? ""}
      </span>
      {message && !listening && (
        <span className="text-xs text-orange-600">{message}</span>
      )}
    </div>
  );
}

export function FieldFeedback({ error, ok }: { error: string | null; ok: boolean }) {
  if (!error && !ok) return null;
  if (ok) return (
    <p className="text-xs text-green-600 flex items-center gap-1"><span>✓</span> Görünüyor güzel!</p>
  );
  return (
    <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span> {error}</p>
  );
}
