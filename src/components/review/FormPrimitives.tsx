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

export function SectionCard({ step, title, badge, children }: {
  step: number; title: string;
  badge?: "required" | "optional" | "conditional";
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
      {children}
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

export function FieldFeedback({ error, ok }: { error: string | null; ok: boolean }) {
  if (!error && !ok) return null;
  if (ok) return (
    <p className="text-xs text-green-600 flex items-center gap-1"><span>✓</span> Görünüyor güzel!</p>
  );
  return (
    <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span> {error}</p>
  );
}
