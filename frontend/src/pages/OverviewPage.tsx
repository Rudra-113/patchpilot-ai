import { demoActivity, demoScoreTrend } from "../data/demo";
import { useAppState } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { PageHeader } from "../components/common/PageHeader";
import { SecurityScore } from "../components/common/SecurityScore";
import { FindingRow } from "../components/security/FindingRow";
import { KpiCard } from "../components/security/KpiCard";
import { ScoreTrend } from "../components/security/ScoreTrend";
import { countsFromFindings, scoreFromFindings, SEVERITY_WEIGHTS } from "../utils/score";
import { workflowStages } from "../data/demo";

const scanners = ["Semgrep", "Bandit", "pip-audit", "Gitleaks", "Trivy"];

export function OverviewPage() {
  usePageTitle("Overview");
  const app = useAppState();
  const counts = countsFromFindings(app.findings);
  const score = scoreFromFindings(app.findings);

  const kpis = [
    { label: "CRITICAL", value: counts.critical, tone: "#FF4D67", caption: "open findings" },
    { label: "HIGH", value: counts.high, tone: "#FF8A3D", caption: "open findings" },
    { label: "MEDIUM", value: counts.medium, tone: "#FFC857", caption: "open findings" },
    { label: "LOW", value: counts.low, tone: "#60A5FA", caption: "open findings" },
    { label: "TOTAL", value: counts.total, tone: "#00B8FF", caption: "awaiting proof" },
  ];

  return (
    <div>
      <PageHeader
        kicker="Command center"
        title="Security posture"
        description="Demo workspace for patchpilot-demo. Counts and the score are calculated from these fixtures. Nothing here is a live scanner run, and nothing is verified."
      />

      <section className="panel flex flex-col gap-6 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-5 sm:grid-cols-3">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-faint">REPOSITORY</p>
            <p className="mt-2 font-display text-2xl font-semibold">{app.repository}</p>
            <p className="mt-1 text-xs text-muted">{app.source}</p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.18em] text-faint">BRANCH</p>
            <p className="mt-2 font-mono text-2xl text-cyan">{app.branch}</p>
            <p className="mt-1 text-xs text-muted">Default comparison branch</p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.18em] text-faint">LAST SCAN</p>
            <p className="mt-2 font-display text-2xl font-semibold">{app.lastScanLabel}</p>
            <p className="mt-1 text-xs text-muted">Fixture timestamp</p>
          </div>
        </div>
        <div className="flex justify-center border-t border-line pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <SecurityScore score={score} />
        </div>
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-12">
        <div className="panel xl:col-span-7">
          <div className="flex items-end justify-between gap-3 border-b border-line px-4 py-4">
            <div>
              <p className="text-[11px] tracking-[0.18em] text-faint">OPEN FINDINGS</p>
              <h2 className="mt-1 font-display text-xl font-semibold">Demo vulnerability queue</h2>
            </div>
            <p className="text-xs text-muted">{counts.total} unfixed</p>
          </div>
          <div>
            {app.findings.map((finding) => (
              <FindingRow key={finding.id} finding={finding} />
            ))}
          </div>
        </div>

        <div className="space-y-4 xl:col-span-5">
          <article className="panel p-5">
            <p className="text-[11px] tracking-[0.18em] text-faint">MISSION</p>
            <h2 className="mt-1 font-display text-xl font-semibold">Prove the fix</h2>
            <ol className="mt-4 space-y-3">
              {workflowStages.map((stage, index) => {
                const done = index < 2;
                return (
                  <li key={stage.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium tracking-[0.08em] uppercase">{stage.label}</p>
                      <p className="text-xs text-muted">{stage.detail}</p>
                    </div>
                    <span className={done ? "font-mono text-[10px] tracking-[0.14em] text-accent" : "font-mono text-[10px] tracking-[0.14em] text-faint"}>
                      {done ? "COMPLETED" : "PENDING"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </article>

          <article className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-faint">SCORE TRAIL</p>
                <h2 className="mt-1 font-display text-xl font-semibold">{score} / 100</h2>
              </div>
              <p className="max-w-[180px] text-right text-[11px] leading-relaxed text-muted">
                Sample trail ending at the calculated demo score.
              </p>
            </div>
            <ScoreTrend data={demoScoreTrend} />
            <p className="text-[11px] leading-relaxed text-faint">
              Score = 100 − (critical×{SEVERITY_WEIGHTS.critical} + high×{SEVERITY_WEIGHTS.high} + medium×
              {SEVERITY_WEIGHTS.medium} + low×{SEVERITY_WEIGHTS.low}). Only a verified finding leaves the penalty.
            </p>
          </article>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <article className="panel p-5">
          <p className="text-[11px] tracking-[0.18em] text-faint">AGENT ACTIVITY</p>
          <h2 className="mt-1 font-display text-xl font-semibold">Latest illustrative events</h2>
          <ol className="mt-4 space-y-4">
            {demoActivity.map((event) => (
              <li key={event.id} className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
                <span className="font-mono text-xs text-cyan">{event.time}</span>
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted">{event.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </article>

        <article className="panel p-5">
          <p className="text-[11px] tracking-[0.18em] text-faint">SCANNER COVERAGE</p>
          <h2 className="mt-1 font-display text-xl font-semibold">Normalized, not trusted yet</h2>
          <ul className="mt-4 space-y-2">
            {scanners.map((scanner) => (
              <li key={scanner} className="flex items-center justify-between rounded-xl border border-line bg-canvas/50 px-3 py-2.5">
                <span className="text-sm">{scanner}</span>
                <span className="text-[10px] tracking-[0.14em] text-medium">FIXTURE</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-elevated">
            <span className="h-full bg-critical" style={{ width: `${counts.total ? (counts.critical / counts.total) * 100 : 0}%` }} />
            <span className="h-full bg-high" style={{ width: `${counts.total ? (counts.high / counts.total) * 100 : 0}%` }} />
            <span className="h-full bg-medium" style={{ width: `${counts.total ? (counts.medium / counts.total) * 100 : 0}%` }} />
            <span className="h-full bg-low" style={{ width: `${counts.total ? (counts.low / counts.total) * 100 : 0}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-faint">Severity mix across the open demo set.</p>
        </article>
      </section>
    </div>
  );
}
