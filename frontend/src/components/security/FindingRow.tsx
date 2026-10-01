import type { Finding } from "../../types/security";
import { SeverityBadge } from "../common/SeverityBadge";

export function FindingRow({ finding }: { finding: Finding }) {
  return (
    <article className="grid grid-cols-1 gap-3 border-b border-line/80 px-4 py-3.5 last:border-b-0 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:items-center">
      <SeverityBadge severity={finding.severity} />
      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium text-ink">{finding.title}</h3>
        <p className="mt-1 truncate font-mono text-[12px] text-muted">
          {finding.file}:{finding.line}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
        <p className="text-xs text-ink">{finding.scanner}</p>
        <p className="mt-1 font-mono text-[11px] text-faint">{finding.cwe}</p>
      </div>
    </article>
  );
}
