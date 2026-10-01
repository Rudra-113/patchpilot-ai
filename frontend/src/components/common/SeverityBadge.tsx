import type { Severity } from "../../types/security";
import { cx } from "../../utils/cx";

const tones: Record<Severity, string> = {
  critical: "border-critical/30 bg-critical/12 text-critical",
  high: "border-high/30 bg-high/12 text-high",
  medium: "border-medium/30 bg-medium/12 text-medium",
  low: "border-low/30 bg-low/12 text-low",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em]",
        tones[severity],
      )}
    >
      {severity.toUpperCase()}
    </span>
  );
}
