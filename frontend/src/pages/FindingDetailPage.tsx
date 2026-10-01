import { Link, useParams } from "react-router-dom";
import { AiAnalysis } from "../components/security/AiAnalysis";
import { CodeDiff } from "../components/code/CodeDiff";
import { SeverityBadge } from "../components/common/SeverityBadge";
import { StatusPill } from "../components/common/StatusPill";
import { FixPanel } from "../components/workflow/FixPanel";
import { useAppState } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";

export function FindingDetailPage() {
  const { findingId = "" } = useParams();
  const app = useAppState();
  const finding = app.findings.find((item) => item.id === findingId);
  usePageTitle(finding?.title ?? "Finding");

  if (app.loading) {
    return <div className="panel p-8 text-sm text-muted">Loading finding...</div>;
  }

  if (!finding) {
    return (
      <div className="panel max-w-xl p-8">
        <h1 className="font-display text-3xl font-semibold">Finding not in this workspace</h1>
        <p className="mt-3 text-sm text-muted">The active scan does not include that id.</p>
        <Link to="/vulnerabilities" className="btn-secondary mt-6">
          Back to vulnerabilities
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] tracking-[0.18em] text-cyan">FINDING</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-semibold tracking-tight">{finding.title}</h1>
        <SeverityBadge severity={finding.severity} />
        <StatusPill status={finding.status} />
      </div>
      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        <div>
          <dt className="text-[10px] tracking-[0.16em] text-faint">CWE</dt>
          <dd className="font-mono text-ink">{finding.cwe}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-[0.16em] text-faint">SCANNER</dt>
          <dd>{finding.scanner}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-[0.16em] text-faint">FILE</dt>
          <dd className="font-mono text-ink">{finding.file}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-[0.16em] text-faint">LINE</dt>
          <dd className="font-mono text-ink">{finding.line}</dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-4">
          <section className="panel p-5">
            <h2 className="text-[11px] tracking-[0.18em] text-faint">DESCRIPTION</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink">{finding.description}</p>
          </section>
          <section className="panel p-5">
            <h2 className="text-[11px] tracking-[0.18em] text-faint">WHY IT MATTERS</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink">{finding.whyItMatters}</p>
          </section>
          <section className="panel p-5">
            <h2 className="text-[11px] tracking-[0.18em] text-faint">AFFECTED CODE</h2>
            <div className="mt-4">
              <CodeDiff file={finding.file} before={finding.code || finding.description} />
            </div>
          </section>
        </div>
        <AiAnalysis analysis={finding.analysis} />
      </div>

      <div className="mt-4">
        <FixPanel finding={finding} />
      </div>

      <section className="panel mt-4 p-5">
        <h2 className="text-[11px] tracking-[0.18em] text-faint">VERIFICATION</h2>
        {finding.verification ? (
          <div className="mt-3">
            <p className={finding.verification.verified ? "font-display text-2xl font-semibold text-accent" : "font-display text-2xl font-semibold text-critical"}>
              {finding.verification.verified ? "PATCH VERIFIED ✓" : "VERIFICATION FAILED"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{finding.verification.summary}</p>
            <Link to="/verification" className="btn-secondary mt-4">
              {finding.verification.verified ? "Open verification" : "Review evidence"}
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Unverified. PatchPilot will not mark this finding resolved until tests pass and a rescan no longer reports it.
          </p>
        )}
      </section>
    </div>
  );
}
