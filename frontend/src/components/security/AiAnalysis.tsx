import { Brain, Sparkles } from "lucide-react";
import type { Analysis } from "../../types/security";

const rows = [
  { key: "rootCause", label: "Root cause" },
  { key: "attackVector", label: "Attack vector" },
  { key: "securityImpact", label: "Security impact" },
  { key: "recommendedRemediation", label: "Recommended remediation" },
] as const;

export function AiAnalysis({ analysis }: { analysis: Analysis | null | undefined }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan/35 bg-cyan/6 p-5 shadow-[0_0_42px_rgba(0,184,255,0.08)]">
      <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-cyan/10 blur-3xl" />
      <div className="relative flex items-center gap-2 text-cyan">
        <Brain className="h-4 w-4" />
        <Sparkles className="h-4 w-4" />
        <h2 className="text-[12px] font-semibold tracking-[0.18em]">AI SECURITY ANALYSIS</h2>
      </div>
      {analysis ? (
        <>
          <p className="relative mt-4 text-sm leading-relaxed text-ink">{analysis.summary}</p>
          <dl className="relative mt-5 space-y-4">
            {rows.map((row) => (
              <div key={row.key}>
                <dt className="text-[10px] tracking-[0.16em] text-cyan uppercase">{row.label}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{analysis[row.key]}</dd>
              </div>
            ))}
          </dl>
          <p className="relative mt-5 text-[11px] leading-relaxed text-faint">
            {analysis.source === "demo"
              ? "Demo analysis. No model call was made, and this text is not scanner evidence."
              : "Model explanation of the scanner finding. The scanner evidence above is unchanged."}
          </p>
        </>
      ) : (
        <div className="relative mt-4">
          <p className="text-sm text-ink">AI service unavailable. Check configuration.</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The finding itself still comes from the scanner record. PatchPilot will not invent an explanation without a configured provider.
          </p>
        </div>
      )}
    </section>
  );
}
