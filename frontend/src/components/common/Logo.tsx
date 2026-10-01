import { useId } from "react";
import { cx } from "../../utils/cx";

export function LogoMark({ className }: { className?: string }) {
  const rawId = useId().replace(/:/g, "");
  const gradientId = `shield-${rawId}`;

  return (
    <svg viewBox="0 0 32 32" className={cx("h-8 w-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="5" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E5A0" />
          <stop offset="1" stopColor="#00B8FF" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.2 27.2 7v8.4c0 6.7-4.6 12.4-11.2 14.6C9.4 27.8 4.8 22.1 4.8 15.4V7L16 2.2Z"
        fill="rgba(0,229,160,0.08)"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.4"
      />
      <path
        d="M10.2 11.2h4.1L16 13l1.7-1.8h4.1"
        stroke="#00B8FF"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.2 17.2 14.3 20.2 21 13.4"
        stroke="#00E5A0"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-[15px] font-semibold tracking-[0.01em]">PatchPilot</span>
        <span className={cx("block text-[10px] tracking-[0.22em] text-cyan", compact && "sr-only")}>AI</span>
      </span>
    </span>
  );
}
