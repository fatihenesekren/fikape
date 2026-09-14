"use client";

// Ustaya özel formlarda (ExpertApplicationForm, ContactSettingsForm) çıplak
// tarayıcı checkbox'ı kullanılıyordu — küçük, stilsiz, marka renksiz
// (kullanıcı fark etti, görsel denetim de doğruladı). Bu, `usta-ol`
// sayfasındaki CheckDot/XDot ikonlarının aksine GERÇEKTEN etkileşimli bir
// checkbox — `<input>` erişilebilirlik için var ama görsel olarak gizli
// (`sr-only`), üzerindeki `<span>` `peer-checked:` ile onu takip ediyor.
export function StyledCheckbox({
  checked,
  onChange,
  children,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex items-start gap-2.5 cursor-pointer ${className ?? "text-sm text-gray-700"}`}>
      <span className="relative shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className="flex items-center justify-center w-5 h-5 rounded-md border-2 border-gray-300 bg-white transition-colors peer-checked:border-transparent peer-checked:bg-[var(--link)] peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-[var(--link)]"
          aria-hidden="true"
        >
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none"
            className={`transition-opacity ${checked ? "opacity-100" : "opacity-0"}`}
          >
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      <span>{children}</span>
    </label>
  );
}
