import { useEffect, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { workflowStages } from "../../data/demo";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { cx } from "../../utils/cx";

const logs = [
  { time: "10:42:11", text: "Repository loaded" },
  { time: "10:42:14", text: "Running Semgrep, Bandit, pip-audit, Gitleaks, Trivy" },
  { time: "10:42:18", text: "AI Security Agent analyzing findings" },
  { time: "10:42:20", text: "Smallest safe patch drafted" },
  { time: "10:42:24", text: "pytest executing" },
  { time: "10:42:27", text: "Original vulnerability no longer detected" },
];

type StageState = "pending" | "running" | "completed";

function stageState(index: number, active: number): StageState {
  if (active >= workflowStages.length) return "completed";
  if (index < active) return "completed";
  if (index === active) return "running";
  return "pending";
}

export function MissionConsole() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(reduced ? workflowStages.length : 0);
  const verified = active >= workflowStages.length;

  useEffect(() => {
    if (reduced) return;
    const delay = verified ? 2400 : 900;
    const timer = window.setTimeout(() => {
      setActive((current) => (current >= workflowStages.length ? 0 : current + 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [active, reduced, verified]);

  const visibleLogs = logs.slice(0, Math.min(logs.length, active + 1));

  return (
    <div className="panel hud relative overflow-hidden p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-cyan">MISSION PREVIEW</p>
          <h2 className="mt-1 font-display text-xl font-semibold">patchpilot-demo</h2>
          <p className="mt-1 text-xs text-muted">Deterministic animation. Not a live scan.</p>
        </div>
        <span className="rounded-full border border-line bg-canvas/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-accent">
          DEMO
        </span>
      </div>

      <ol className="mt-5 space-y-2">
        {workflowStages.map((stage, index) => {
          const state = stageState(index, active);
          return (
            <li key={stage.id} className="flex items-center gap-3">
              <span
                className={cx(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]",
                  state === "completed" && "border-accent/50 bg-accent/10 text-accent",
                  state === "running" && "border-cyan/60 bg-cyan/10 text-cyan",
                  state === "pending" && "border-line text-faint",
                )}
              >
                {state === "completed" ? <Check className="h-3.5 w-3.5" /> : String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium tracking-[0.08em] uppercase">{stage.label}</span>
                  <span
                    className={cx(
                      "font-mono text-[10px] tracking-[0.14em]",
                      state === "completed" && "text-accent",
                      state === "running" && "text-cyan",
                      state === "pending" && "text-faint",
                    )}
                  >
                    {state.toUpperCase()}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 rounded-xl border border-line bg-canvas/80 p-3">
        <p className="mb-2 text-[10px] tracking-[0.18em] text-faint">AGENT LOG</p>
        <div className="space-y-1.5 font-mono text-[12px] leading-5 text-muted">
          {visibleLogs.map((line, index) => (
            <p key={line.time}>
              <span className="text-faint">[{line.time}]</span> {line.text}
              {index === visibleLogs.length - 1 && !verified ? <span className="caret" /> : null}
            </p>
          ))}
        </div>
      </div>

      <div
        className={cx(
          "mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3 transition-shadow",
          verified
            ? "border-accent/40 bg-accent/10 shadow-[0_0_36px_rgba(0,229,160,0.16)]"
            : "border-line bg-canvas/40",
        )}
        aria-live="polite"
      >
        <ShieldCheck className={cx("h-8 w-8 shrink-0", verified ? "text-accent" : "text-faint")} />
        <div>
          <p className={cx("font-display text-lg font-semibold tracking-[0.04em]", verified ? "text-accent" : "text-muted")}>
            {verified ? "PATCH VERIFIED ✓" : "PROOF PENDING"}
          </p>
          <p className="text-xs text-muted">
            {verified ? "Vulnerability resolved · evidence attached" : "Verified only after rescan and tests"}
          </p>
        </div>
      </div>
    </div>
  );
}
