import type { FindingStatus } from "../../types/security";
import { statusLabel } from "../../utils/format";
import { cx } from "../../utils/cx";

const tones: Record<FindingStatus, string> = {
  unfixed: "border-line text-muted",
  fix_ready: "border-cyan/40 text-cyan",
  applied: "border-medium/40 text-medium",
  verified: "border-accent/40 text-accent",
  failed: "border-critical/40 text-critical",
};

export function StatusPill({ status }: { status: FindingStatus }) {
  return (
    <span className={cx("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em]", tones[status])}>
      {statusLabel(status)}
    </span>
  );
}
