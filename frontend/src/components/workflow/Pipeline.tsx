import { Check, LoaderCircle, Minus } from "lucide-react";
import type { PipelineStage } from "../../types/security";
import { cx } from "../../utils/cx";

export function Pipeline({ stages }: { stages: PipelineStage[] }) {
  return (
    <section className="panel p-4 sm:p-5">
      <p className="text-[11px] tracking-[0.18em] text-faint">PIPELINE</p>
      <ol className="mt-4">
        {stages.map((stage, index) => (
          <li key={stage.id} className="relative flex gap-3 pb-4 last:pb-0">
            {index < stages.length - 1 ? <span className="absolute top-7 left-[13px] h-[calc(100%-12px)] w-px bg-line" /> : null}
            <span
              className={cx(
                "relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                stage.status === "completed" && "border-accent/50 bg-accent/10 text-accent",
                stage.status === "running" && "border-cyan/60 bg-cyan/10 text-cyan",
                stage.status === "failed" && "border-critical/60 bg-critical/10 text-critical",
                stage.status === "pending" && "border-line text-faint",
              )}
            >
              {stage.status === "completed" ? <Check className="h-3.5 w-3.5" /> : null}
              {stage.status === "running" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
              {stage.status === "failed" ? <span className="text-xs font-semibold">!</span> : null}
              {stage.status === "pending" ? <Minus className="h-3.5 w-3.5" /> : null}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{stage.label}</p>
                <p
                  className={cx(
                    "font-mono text-[10px] tracking-[0.14em]",
                    stage.status === "completed" && "text-accent",
                    stage.status === "running" && "text-cyan",
                    stage.status === "failed" && "text-critical",
                    stage.status === "pending" && "text-faint",
                  )}
                >
                  {stage.status.toUpperCase()}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
