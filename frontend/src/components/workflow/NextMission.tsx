import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useAppState } from "../../context/AppContext";
import { SeverityBadge } from "../common/SeverityBadge";
import { isOpenFinding, scoreFromFindings, SEVERITY_WEIGHTS, sortFindings } from "../../utils/score";

export function NextMission({ excludeId }: { excludeId?: string }) {
  const app = useAppState();
  const findings = app.findings;
  const next = sortFindings(findings).find((finding) => isOpenFinding(finding) && finding.id !== excludeId);
  const score = scoreFromFindings(findings);
  const proved = findings.filter((finding) => finding.status === "verified").length;

  if (!app.scan || findings.length === 0) return null;

  if (!next) {
    return (
      <section className="verified-glow rounded-[24px] border border-accent/40 px-5 py-5 sm:px-6">
        <p className="text-[11px] tracking-[0.22em] text-accent">QUEUE CLEAR</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Every finding in this workspace is verified.</h2>
            <p className="mt-2 text-sm text-muted">
              {proved} proved · security score {score} / 100 · SECURE
            </p>
          </div>
          <Link to="/verification" className="btn-secondary">
            <ShieldCheck className="h-4 w-4" />
            Review evidence
          </Link>
        </div>
      </section>
    );
  }

  const lift = SEVERITY_WEIGHTS[next.severity];
  return (
    <section className="rounded-[24px] border border-cyan/30 bg-cyan/5 px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-cyan">NEXT TO PROVE</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">{next.title}</h2>
            <SeverityBadge severity={next.severity} />
          </div>
          <p className="mt-2 font-mono text-xs text-muted">
            {next.file}:{next.line} · {next.cwe}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink">
            {proved} of {findings.length} proved. Verifying this finding lifts the score by {lift}, from {score} to {score + lift}.
          </p>
        </div>
        <Link to={`/vulnerabilities/${next.id}`} className="btn-primary">
          Open finding
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
