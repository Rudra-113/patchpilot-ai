import { Link } from "react-router-dom";
import type { Finding } from "../../types/security";
import { SeverityBadge } from "../common/SeverityBadge";
import { StatusPill } from "../common/StatusPill";

export function FindingRow({ finding, href }: { finding: Finding; href?: string }) {
  const body = (
    <>
      <SeverityBadge severity={finding.severity} />
      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium text-ink">{finding.title}</h3>
        <p className="mt-1 truncate font-mono text-[12px] text-muted">
          {finding.file}:{finding.line}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:block sm:text-right">
        <StatusPill status={finding.status} />
        <p className="mt-1 text-xs text-ink">{finding.scanner}</p>
        <p className="font-mono text-[11px] text-faint">{finding.cwe}</p>
      </div>
    </>
  );
  const className = "grid grid-cols-1 gap-3 border-b border-line/80 px-4 py-3.5 last:border-b-0 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:items-center";
  if (!href) {
    return <article className={className}>{body}</article>;
  }
  return (
    <Link to={href} className={`${className} transition-colors hover:bg-elevated/70`}>
      {body}
    </Link>
  );
}
