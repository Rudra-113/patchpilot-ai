import { Link } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { StatusPill } from "../components/common/StatusPill";
import { NextMission } from "../components/workflow/NextMission";
import { useAppState } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";

export function FixesPage() {
  usePageTitle("Fixes");
  const app = useAppState();
  const fixes = app.findings.filter((finding) => finding.status !== "unfixed" || finding.fix);
  const sql = app.findings.find((finding) => finding.title === "SQL Injection");

  return (
    <div>
      <PageHeader
        kicker="Remediation"
        title="Fixes"
        description="A generated patch is ready for review. It stays unverified until tests pass and the original finding disappears from a rescan."
      />
      {fixes.length > 0 ? (
        <div className="mb-4">
          <NextMission />
        </div>
      ) : null}
      {fixes.length === 0 ? (
        <div className="panel max-w-2xl p-6">
          <p className="text-[11px] tracking-[0.18em] text-accent">NO PATCHES YET</p>
          <h2 className="mt-3 font-display text-2xl font-semibold">Start with the critical SQL injection.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Generate a fix, apply it, run the suite, and rescan. The score does not move until verification evidence exists.
          </p>
          {sql ? (
            <Link to={`/vulnerabilities/${sql.id}`} className="btn-primary mt-5">
              Open SQL injection
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3">
          {fixes.map((finding) => (
            <Link key={finding.id} to={`/vulnerabilities/${finding.id}`} className="panel panel-hover block p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold">{finding.title}</h2>
                <StatusPill status={finding.status} />
              </div>
              <p className="mt-2 font-mono text-xs text-muted">
                {finding.file}:{finding.line}
              </p>
              <p className="mt-3 text-sm text-muted">{finding.fix?.summary ?? "Patch recorded without a summary."}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
