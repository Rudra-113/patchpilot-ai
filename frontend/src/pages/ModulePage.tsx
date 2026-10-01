import { Link } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { usePageTitle } from "../hooks/usePageTitle";

const modules = {
  scan: {
    kicker: "Ingest",
    title: "Scan Repository",
    body: "This console will accept a GitHub URL or a repository ZIP, then walk ingestion, scanners, normalization, analysis, fixes, tests, and verification. The pipeline is not wired yet. The command center already shows the deterministic demo posture.",
  },
  vulnerabilities: {
    kicker: "Queue",
    title: "Vulnerabilities",
    body: "Findings from every scanner will land here in one shape: severity, file, line, CWE, and status. The overview already lists the demo set. Filters and the detail view are next.",
  },
  fixes: {
    kicker: "Remediation",
    title: "Fixes",
    body: "Generate, review, and apply the smallest safe patch. A fix is not verification. This queue stays empty of verified work until a rescan proves the original finding is gone.",
  },
  verification: {
    kicker: "Evidence",
    title: "Verification",
    body: "PATCH VERIFIED is reserved for evidence: the security scan completed, tests passed, and the original vulnerability is no longer reported. Nothing in the demo workspace has reached that state.",
  },
  activity: {
    kicker: "Timeline",
    title: "Agent Activity",
    body: "The autonomous engineer will write a timestamped trail here: ingest, scan, analysis, patch, tests, rescan, and the verification result. The overview shows a short illustrative preview.",
  },
  history: {
    kicker: "Records",
    title: "Scan History",
    body: "Completed scans will keep repository, branch, finding counts, score, and status. The current screen is the demo workspace only, so there is no historical scan to open.",
  },
  settings: {
    kicker: "Configuration",
    title: "Settings",
    body: "AI provider, scanner availability, GitHub, and Docker status will live here. Secrets stay on the server. This demo build does not pretend those integrations are connected.",
  },
} as const;

export function ModulePage({ id }: { id: keyof typeof modules }) {
  const module = modules[id];
  usePageTitle(module.title);

  return (
    <div>
      <PageHeader kicker={module.kicker} title={module.title} description={module.body} />
      <div className="panel max-w-3xl p-6">
        <p className="text-[11px] tracking-[0.18em] text-accent">DEMO MODE</p>
        <h2 className="mt-3 font-display text-2xl font-semibold">This module is staged, not a dead end.</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Return to the command center to review the ten demo findings and the calculated security score of 72.
        </p>
        <Link to="/overview" className="btn-secondary mt-6">
          Back to overview
        </Link>
      </div>
    </div>
  );
}
