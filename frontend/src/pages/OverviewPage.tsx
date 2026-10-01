import { Link } from "react-router-dom";
import { DemoNotice } from "../components/common/DemoNotice";
import { PageHeader } from "../components/common/PageHeader";
import { SecurityScore } from "../components/common/SecurityScore";
import { FindingRow } from "../components/security/FindingRow";
import { KpiCard } from "../components/security/KpiCard";
import { ScoreTrend } from "../components/security/ScoreTrend";
import { demoScoreTrend } from "../data/demo";
import { useAppState } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";
import type { PipelineStage } from "../types/security";
import { countsFromFindings, scoreFromFindings, SEVERITY_WEIGHTS } from "../utils/score";

function missionState(stages: PipelineStage[], ids: string[]) {
  const selected = stages.filter((stage) => ids.includes(stage.id));
  if (selected.some((stage) => stage.status === "failed")) return "FAILED";
  if (selected.length > 0 && selected.every((stage) => stage.status === "completed")) return "COMPLETED";
  if (selected.some((stage) => stage.status === "running" || stage.status === "completed")) return "RUNNING";
  return "PENDING";
}

export function OverviewPage() {
  usePageTitle("Overview");
  const app = useAppState();
  const findings = app.findings;
  const counts = countsFromFindings(findings);
  const score = app.scan ? scoreFromFindings(findings) : 0;
  const trend = demoScoreTrend.map((point, index) => (index === demoScoreTrend.length - 1 ? { ...point, score } : point));
  const stages = app.scan?.stages ?? [];
  const mission = [
    { label: "Scan", detail: "Repository scanners", state: missionState(stages, ["repository", "ingestion", "scanners", "normalization"]) },
    { label: "Understand", detail: "Root cause and impact", state: missionState(stages, ["analysis"]) },
    { label: "Fix", detail: "Smallest safe patch", state: missionState(stages, ["fixes"]) },
    { label: "Test", detail: "Pytest on the tree", state: missionState(stages, ["tests"]) },
    { label: "Verify", detail: "Rescan for the original finding", state: missionState(stages, ["verification"]) },
  ];

  const kpis = [
    { label: "CRITICAL", value: counts.critical, tone: "#FF4D67", caption: "open findings" },
    { label: "HIGH", value: counts.high, tone: "#FF8A3D", caption: "open findings" },
    { label: "MEDIUM", value: counts.medium, tone: "#FFC857", caption: "open findings" },
    { label: "LOW", value: counts.low, tone: "#60A5FA", caption: "open findings" },
    { label: "TOTAL", value: counts.total, tone: "#00B8FF", caption: "awaiting proof" },
  ];

  if (app.loading) {
    return (
      <div className="panel p-8">
        <p className="text-[11px] tracking-[0.18em] text-cyan">COMMAND CENTER</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Loading the demo workspace...</h1>
      </div>
    );
  }

  if (!app.scan) {
    return (
      <div className="panel p-8" role="alert">
        <p className="text-[11px] tracking-[0.18em] text-critical">API</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">{app.error ?? "The workspace did not load."}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{app.errorDetail || "Start the PatchPilot backend and retry."}</p>
        <button type="button" className="btn-primary mt-6" onClick={() => void app.refresh()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Command center"
        title="Security posture"
        description="Counts and the score are calculated from the findings in this workspace. A finding leaves the score only after verification evidence exists."
      />
      {app.scan.demoMode ? <DemoNotice>{app.scan.note}</DemoNotice> : null}

      <section className="panel flex flex-col gap-6 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-5 sm:grid-cols-3">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-faint">REPOSITORY</p>
            <p className="mt-2 font-display text-2xl font-semibold">{app.repository}</p>
            <p className="mt-1 text-xs text-muted">{app.scan.demoMode ? "Deterministic demo fixtures" : "Scanner output"}</p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.18em] text-faint">BRANCH</p>
            <p className="mt-2 font-mono text-2xl text-cyan">{app.branch}</p>
            <p className="mt-1 text-xs text-muted">Default comparison branch</p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.18em] text-faint">LAST SCAN</p>
            <p className="mt-2 font-display text-2xl font-semibold">{app.lastScanLabel}</p>
            <p className="mt-1 text-xs text-muted">{app.scan.status}</p>
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
              <h2 className="mt-1 font-display text-xl font-semibold">Vulnerability queue</h2>
            </div>
            <Link to="/vulnerabilities" className="text-xs text-cyan">
              View all
            </Link>
          </div>
          <div>
            {findings.map((finding) => (
              <FindingRow key={finding.id} finding={finding} href={`/vulnerabilities/${finding.id}`} />
            ))}
          </div>
        </div>

        <div className="space-y-4 xl:col-span-5">
          <article className="panel p-5">
            <p className="text-[11px] tracking-[0.18em] text-faint">MISSION</p>
            <h2 className="mt-1 font-display text-xl font-semibold">Prove the fix</h2>
            <ol className="mt-4 space-y-3">
              {mission.map((stage) => (
                <li key={stage.label} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium tracking-[0.08em] uppercase">{stage.label}</p>
                    <p className="text-xs text-muted">{stage.detail}</p>
                  </div>
                  <span className={stage.state === "COMPLETED" ? "font-mono text-[10px] tracking-[0.14em] text-accent" : stage.state === "FAILED" ? "font-mono text-[10px] tracking-[0.14em] text-critical" : "font-mono text-[10px] tracking-[0.14em] text-faint"}>
                    {stage.state}
                  </span>
                </li>
              ))}
            </ol>
          </article>

          <article className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-faint">SCORE TRAIL</p>
                <h2 className="mt-1 font-display text-xl font-semibold">{score} / 100</h2>
              </div>
              <p className="max-w-[180px] text-right text-[11px] leading-relaxed text-muted">
                Sample weekday trail. The latest point is the current score.
              </p>
            </div>
            <ScoreTrend data={trend} />
            <p className="text-[11px] leading-relaxed text-faint">
              Score = 100 − (critical×{SEVERITY_WEIGHTS.critical} + high×{SEVERITY_WEIGHTS.high} + medium×
              {SEVERITY_WEIGHTS.medium} + low×{SEVERITY_WEIGHTS.low}). Only a verified finding leaves the penalty.
            </p>
          </article>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <article className="panel p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] tracking-[0.18em] text-faint">AGENT ACTIVITY</p>
              <h2 className="mt-1 font-display text-xl font-semibold">Latest events</h2>
            </div>
            <Link to="/activity" className="text-xs text-cyan">
              Full timeline
            </Link>
          </div>
          <ol className="mt-4 space-y-4">
            {app.scan.activity.slice(-4).map((event) => (
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
          <h2 className="mt-1 font-display text-xl font-semibold">Tool availability</h2>
          <ul className="mt-4 space-y-2">
            {(app.settings?.scanners ?? []).map((scanner) => (
              <li key={scanner.name} className="flex items-center justify-between rounded-xl border border-line bg-canvas/50 px-3 py-2.5">
                <span className="text-sm">{scanner.name}</span>
                <span className={scanner.available ? "text-[10px] tracking-[0.14em] text-accent" : "text-[10px] tracking-[0.14em] text-medium"}>
                  {scanner.available ? "AVAILABLE" : "NOT INSTALLED"}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-elevated">
            <span className="h-full bg-critical" style={{ width: `${counts.total ? (counts.critical / counts.total) * 100 : 0}%` }} />
            <span className="h-full bg-high" style={{ width: `${counts.total ? (counts.high / counts.total) * 100 : 0}%` }} />
            <span className="h-full bg-medium" style={{ width: `${counts.total ? (counts.medium / counts.total) * 100 : 0}%` }} />
            <span className="h-full bg-low" style={{ width: `${counts.total ? (counts.low / counts.total) * 100 : 0}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-faint">Severity mix across findings that are not verified.</p>
        </article>
      </section>
    </div>
  );
}
