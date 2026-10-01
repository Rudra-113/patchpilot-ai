import { useEffect, useState } from "react";
import { ApiFailure } from "../../services/api";
import type { Finding } from "../../types/security";
import { useAppState } from "../../context/AppContext";
import { wait } from "../../utils/format";
import { cx } from "../../utils/cx";
import { CodeDiff } from "../code/CodeDiff";

const steps = [
  "Analyzing vulnerability...",
  "Identifying root cause...",
  "Designing remediation...",
  "Generating patch...",
  "Reviewing patch...",
];

type Phase = "idle" | "generating" | "ready" | "applying" | "testing" | "rescanning" | "verified" | "failed" | "error";

function restingPhase(finding: Finding): Phase {
  if (finding.verification?.verified) return "verified";
  if (finding.verification && !finding.verification.verified) return "failed";
  if (finding.fix && (finding.status === "fix_ready" || finding.status === "failed")) return "ready";
  if (finding.status === "applied") return "ready";
  return "idle";
}

export function FixPanel({ finding }: { finding: Finding }) {
  const workspace = useAppState();
  const [phase, setPhase] = useState<Phase>(restingPhase(finding));
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [detail, setDetail] = useState("");
  const [trail, setTrail] = useState<string[]>([]);
  const [cancelled, setCancelled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (busy || phase === "error" || phase === "generating" || phase === "applying" || phase === "testing" || phase === "rescanning") {
      return;
    }
    setPhase(restingPhase(finding));
  }, [finding.id, finding.status, finding.verification?.verified, finding.fix?.after, busy, phase]);

  async function onGenerate() {
    setBusy(true);
    setCancelled(false);
    setPhase("generating");
    setStep(0);
    setMessage("");
    setDetail("");
    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      if (current < steps.length) setStep(current);
    }, 700);
    try {
      await Promise.all([workspace.generateFix(finding.id), wait(steps.length * 700)]);
      setMessage("Patch generated successfully.");
      setPhase("ready");
    } catch (error) {
      const failure = error instanceof ApiFailure ? error : new ApiFailure("Unable to generate patch.");
      setMessage(failure.message || "Unable to generate patch.");
      setDetail(failure.detail);
      setPhase("error");
    } finally {
      window.clearInterval(timer);
      setBusy(false);
    }
  }

  async function onApply() {
    setBusy(true);
    setCancelled(false);
    setMessage("");
    setDetail("");
    setTrail([]);
    try {
      setPhase("applying");
      await workspace.applyFix(finding.id);
      setTrail(["PATCH APPLIED ✓"]);
      setPhase("testing");
      const tests = await Promise.all([workspace.runTests(finding.id), wait(700)]).then(([result]) => result);
      setDetail(tests.note);
      setTrail((current) => [
        ...current,
        tests.status === "passed" ? "TESTS PASSED ✓" : "TESTS FAILED",
        `${tests.command} · ${tests.passed} passed · ${tests.failed} failed`,
      ]);
      setPhase("rescanning");
      await wait(500);
      const verification = await workspace.verifyFix(finding.id);
      setPhase(verification.verified ? "verified" : "failed");
      setMessage(verification.verified ? "Patch verified." : verification.summary);
      setDetail(verification.demoMode ? "Demo evidence. The bundled rescan no longer contains this finding." : "");
    } catch (error) {
      const failure = error instanceof ApiFailure ? error : new ApiFailure("Unable to apply patch.");
      setMessage(failure.message);
      setDetail(failure.detail);
      setPhase("error");
    } finally {
      setBusy(false);
    }
  }

  const fix = finding.fix;
  const showReady = phase === "ready" && fix && !cancelled;

  return (
    <section className="panel p-5">
      <p className="text-[11px] tracking-[0.18em] text-faint">REMEDIATION</p>
      <h2 className="mt-1 font-display text-2xl font-semibold">Fix</h2>

      {phase === "idle" ? (
        <div className="mt-4">
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Generate the smallest patch that preserves behavior. A generated patch is not verification.
          </p>
          <button type="button" className="btn-primary mt-4" onClick={() => void onGenerate()} disabled={busy}>
            Generate fix
          </button>
        </div>
      ) : null}

      {phase === "generating" ? (
        <div className="mt-5" aria-live="polite">
          <p className="text-[11px] tracking-[0.18em] text-cyan">AI SECURITY AGENT</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">Analyzing vulnerability...</p>
          <ol className="mt-4 space-y-2">
            {steps.map((label, index) => (
              <li key={label} className={cx("text-sm", index < step ? "text-accent" : index === step ? "text-cyan" : "text-faint")}>
                {index < step ? "✓" : index === step ? "●" : "○"} {label}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {showReady ? (
        <div className="mt-5">
          <p className="font-display text-2xl font-semibold text-accent">FIX READY ✓</p>
          <p className="mt-2 text-sm text-muted">{message || "Patch generated successfully."}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink">{fix.explanation}</p>
          <div className="mt-4">
            <CodeDiff file={fix.file} before={fix.before} after={fix.after} />
          </div>
          {fix.source === "demo" ? (
            <p className="mt-3 text-[11px] text-faint">Demo patch. No model call was made.</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => void onApply()} disabled={busy}>
              Apply fix
            </button>
            <button type="button" className="btn-secondary" onClick={() => void onGenerate()} disabled={busy}>
              Regenerate
            </button>
            <button type="button" className="btn-secondary" onClick={() => setCancelled(true)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {phase === "ready" && cancelled && fix ? (
        <div className="mt-4 rounded-xl border border-line bg-canvas/50 px-4 py-3">
          <p className="text-sm text-ink">Cancelled. The patch is saved as ready and has not been applied.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => setCancelled(false)}>
              Review patch
            </button>
            <button type="button" className="btn-secondary" onClick={() => void onApply()} disabled={busy}>
              Apply fix
            </button>
          </div>
        </div>
      ) : null}

      {phase === "applying" || phase === "testing" || phase === "rescanning" ? (
        <div className="mt-5" aria-live="polite">
          {trail.map((item) => (
            <p key={item} className="font-display text-xl font-semibold text-accent">
              {item}
            </p>
          ))}
          {phase === "applying" ? <p className="mt-2 text-sm text-cyan">Applying patch...</p> : null}
          {phase === "testing" ? <p className="mt-2 text-sm text-cyan">Running tests...</p> : null}
          {phase === "rescanning" ? <p className="mt-2 text-sm text-cyan">Security re-scan starting...</p> : null}
          {detail ? <p className="mt-2 text-xs leading-relaxed text-faint">{detail}</p> : null}
        </div>
      ) : null}

      {phase === "verified" && fix ? (
        <div className="mt-5">
          <p className="font-display text-2xl font-semibold text-accent">PATCH VERIFIED ✓</p>
          <p className="mt-2 text-sm text-muted">{message}</p>
          {detail ? <p className="mt-1 text-xs text-faint">{detail}</p> : null}
          {finding.testResult ? (
            <p className="mt-3 font-mono text-sm text-ink">
              {finding.testResult.command} · {finding.testResult.passed} passed · {finding.testResult.failed} failed
            </p>
          ) : null}
          {finding.testResult?.note ? <p className="mt-2 text-xs leading-relaxed text-faint">{finding.testResult.note}</p> : null}
          <div className="mt-4">
            <CodeDiff file={fix.file} before={fix.before} after={fix.after} />
          </div>
        </div>
      ) : null}

      {phase === "failed" ? (
        <div className="mt-5 rounded-2xl border border-critical/40 bg-critical/8 p-4">
          <p className="font-display text-2xl font-semibold text-critical">VERIFICATION FAILED</p>
          <p className="mt-2 text-sm leading-relaxed text-ink">{finding.verification?.summary || message}</p>
          <button type="button" className="btn-secondary mt-4" onClick={() => void onGenerate()} disabled={busy}>
            Review patch
          </button>
        </div>
      ) : null}

      {phase === "error" ? (
        <div className="mt-5 rounded-2xl border border-critical/40 bg-critical/8 p-4" role="alert">
          <p className="text-sm font-medium text-critical">{message || "Unable to generate patch."}</p>
          {detail ? <p className="mt-2 text-sm text-muted">{detail}</p> : null}
          <button type="button" className="btn-secondary mt-4" onClick={() => void onGenerate()}>
            Try again
          </button>
        </div>
      ) : null}
    </section>
  );
}
